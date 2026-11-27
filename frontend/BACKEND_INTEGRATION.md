# Mindsupport backend integration outline

This is an implementation checklist for connecting the current frontend. It does not provision accounts, deploy services, or enable real client submissions.

## Lightweight services from the supplied PRD

| Need | PRD-aligned service | Production responsibility |
|---|---|---|
| API and application backend | Node.js + Express on Railway | Validate requests, rate-limit public forms, enforce staff authorization, issue signed sessions, run background work, and expose narrowly scoped APIs. |
| Persistent records | PostgreSQL with Prisma | Store leads, bookings, message-review records, subscribers, payment state, campaigns and audit events with retention rules and access boundaries. |
| Paid booking ledger | Google Apps Script and Google Sheets | After Paystack verification and the PostgreSQL transaction commits, send the paid session/registration record to the wholesale/accounting Sheet. PostgreSQL remains authoritative; Sheets is a downstream ledger/reporting view. Queue and retry idempotently; Sheet failure never changes payment state. |
| Transactional email | Resend (current requested provider) | Send booking/account notifications and the separately consented insights welcome email. Keep the API key server-side; use an outbox, deduplication, delivery logging and suppression/unsubscribe handling. Email delivery failure never changes payment state. |
| Checkout | Paystack | Create booking-specific checkout links and verify payment only from a validated signed webhook. A browser redirect or admin button must never count as payment proof. |
| Edge security and bot protection | Cloudflare + Turnstile (planned) | Protect public form endpoints with rate limits and bot controls. If Turnstile is used, validate each short-lived token server-side with Cloudflare Siteverify; a client widget alone does not protect submissions. |
| Traffic, conversion and audience analytics | Google Analytics 4 for acquisition/events/audience reports; Cloudflare Web Analytics for real-user performance | Measure aggregate page views, referrers/UTM campaigns, device mix, landing pages, call/session funnel events, and available age brackets. Configure Google Signals and analytics consent settings as required; demographic reports may be sampled or thresholded and are not available for every visitor. Keep all analytics free of message text, email, health details, booking IDs, and identity-level joins. |
| Public frontend | Existing Next.js App Router frontend | Server-render approved public Reflections content and SEO metadata; call the API without exposing service credentials. |

The anonymous-message form has no sender contact fields and does not support a private reply to that message. If the firm later adds an outreach option, it must be an explicit, separate contact flow and must not silently identify or join the anonymous post. Email insights opt-in is a separate subscription flow. Static welcome assets such as an approved grounding audio file can be served from the app's static assets; do not add a new vendor unless the content or traffic needs it.

## Analytics and measurement boundary

- Use Google Analytics 4 for aggregate acquisition, audience and funnel reporting, including available age brackets; use Cloudflare Web Analytics for Core Web Vitals and real-user performance.
- Enable and configure Google Signals and the relevant analytics consent settings for age reports. Demographic results are aggregate, depend on eligible Google signals, and may be withheld at low volumes; they are not a complete age census of all visitors.
- Track referral and campaign performance with approved UTM values and aggregate conversion events, without sending form content, email addresses, client records, or anonymous-message identifiers.
- Keep age brackets at the aggregate audience-report level. Do not ask for age on an anonymous message or connect demographics to a specific reflection, submission, or client record.
- Put the analytics dashboard in the authenticated admin area only after the backend and provider are connected. Current frontend controls are previews; no real traffic metrics are available yet.
- Cloudflare Turnstile is a bot challenge, not a honeypot field. Treat any invisible honeypot as an additional server-validated trap if desired; never present either as a substitute for rate limits or input validation.

## Subscriber record contract

Suggested table: `subscribers`.

| Field | Type | Rule |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String | Required; normalized; unique index |
| `source` | String/enum | Coarse value such as `reflections`; never a message identifier |
| `consent_given` | Boolean | Must be true before creation |
| `consent_at` | Timestamp | Server-recorded consent time |
| `created_at` | Timestamp | Server-recorded creation time |

This schema intentionally has no `message_id`, message content, reply email, session ID, or field joining it to a particular anonymous post. Post-submit and feed sign-ups use the same coarse source value, so the row does not disclose which specific submission preceded it. Keep separate database tables and permissions, and do not join subscriber records to messages in analytics or exports.

## Other minimum records and safeguards

- **Anonymous messages:** message text, publication-consent evidence, campaign source where relevant, moderation status, reviewed public excerpt, and timestamps. Do not collect sender identity/contact or IP data in this pipeline; do not save subscriber email on this record.
- **Leads and bookings:** contact details, source, booking service and appointment state. Keep optional personal circumstances out of analytics and only retain what the firm has approved.
- **Payments:** booking relation, provider checkout reference, amount/currency, verified state and webhook event ID. Verify webhook signature, idempotency and booking/amount match before marking paid.
- **Admin access:** authenticated staff accounts, server-checked roles, secure HttpOnly session cookies, CSRF protections where needed, audit events, rate limits and no public `/manager` access to real records.
- **Email jobs:** deduplicate welcome and recovery messages; use an unsubscribe/suppression state; record delivery outcomes without adding subscriber/message joins.
- **Retention:** define deletion periods, access/export procedures and the privacy notice before collecting real therapy-related content.

## Security launch gate

- Keep the manager preview public only with fictional demo data. Before real data is stored, require server-enforced staff authentication, least-privilege authorization, secure password hashing, MFA for administrators, session expiry/revocation, audit logs, and recovery protections. Do not ship a client-only username/password gate.
- Put production behind HTTPS and Cloudflare. Configure WAF rules, rate limits for form/auth/payment endpoints, bot controls, caching rules that exclude private/admin responses, DDoS response settings and origin protection so the app host is not directly exposed.
- If using Cloudflare Turnstile, include its token in public form submissions and verify it from the backend with Siteverify before accepting the request. The browser widget alone does not stop forged requests. Add server-side honeypot checks only as a supplemental signal.
- Validate request schemas, lengths, enum values, content type, origin/CSRF defenses, authorization and rate limits on every API route. Encode rendered text, sanitize any allowed rich content, avoid raw HTML rendering, and protect payment creation and webhook updates from replay/tampering.
- Keep provider secrets and payment keys on the server. Do not treat browser validation, hidden fields, localStorage, disabled buttons, or client-side role checks as security controls.
- Apply and test a restrictive Content Security Policy and secure cookie settings after the final analytics/payment providers are chosen. The frontend currently applies baseline response headers (`nosniff`, frame denial, referrer policy, and disabled camera/microphone/location permissions); these do not replace the launch gate above.
- No design can guarantee that attacks or outages are impossible. Monitor provider security/availability metrics, establish backups and incident response, and test recovery before launch.

## Booking and payment consistency contract

The browser must never be the authority for payment or appointment state. A return from Paystack means “verify status,” not “paid.” The frontend should show `Verifying payment` while it asks the backend; only a backend-confirmed state can display `Paid` or `Booking confirmed`. If the user closes the tab, loses connection, or the verification endpoint is temporarily unavailable, preserve `Pending verification` and let the user check again. Show `Failed` only after the provider/backend has an authoritative failed or expired result. Do not invite a second charge while the first attempt is unknown.

Required server behavior before production:

1. Create every booking/payment request with a client-generated idempotency key, scoped to the authenticated or validated requester. Persist the key with a unique constraint and return the original result on retries; a timeout or repeated click must not create another booking or Paystack transaction.
2. Give each Paystack attempt one unique provider reference and one booking relation. For current Paystack webhooks, validate `Paystack-Signature` against the exact raw request body before JSON parsing; enforce its timestamp window, compare HMAC digests in constant time, and keep secret rotation support. The backend contains a tested standalone verifier, but no webhook route or payment processing is active yet. Verify the reference, amount, currency, booking, and final provider status from the webhook/backend query. Persist provider event IDs with a unique constraint and apply each event exactly once. Never mark paid from query parameters, client state, or a redirect.
3. Use an explicit state machine, e.g. `requested → awaiting_payment → verifying → paid` or `failed/expired/cancelled`. Keep unknown network outcomes pending; store timestamps and provider references for reconciliation. Send receipts or confirmation only after the verified paid transition commits.
4. Reserve a concrete available slot atomically before exposing it as held. Use a unique constraint or transaction/row lock so concurrent requests cannot claim the same therapist and time. Holds must expire. Confirm a reservation only after payment succeeds; if a late payment arrives after its hold expired, do not silently double-book—route it to reconciliation/refund handling.
5. When a concrete slot is held for a complimentary session, reserve one credit in the same database transaction using an atomic conditional update (`remaining > 0`). Track the reservation on the booking. On confirmation, convert the reservation to a used credit exactly once; on hold expiry/cancellation, release it exactly once. Two concurrent requests must never spend or reserve the same credit.
6. Commit payment/booking changes and an outbox job together. Send confirmation, failed-payment support, and the PRD’s 30-minute abandoned-checkout recovery from deduplicated background jobs. A notification failure must not reverse or invent payment state.
   - The paid-booking Google Sheets export is also a deduplicated outbox job created only after payment verification and the PostgreSQL commit. Retry delivery and alert the manager on persistent failure; do not create a second booking or mark the payment failed because Sheets is unavailable.
7. Test duplicate clicks, duplicate and out-of-order webhooks, a delayed webhook after a lost browser response, amount/reference mismatch, webhook signature failure, competing slot requests, expired holds, and duplicate credit use. Reconcile the payment ledger against Paystack before launch.

Frontend behavior to preserve: disable the submit control while a request is in flight, reuse the same idempotency key for a retry of the same intent, explain pending/failed states plainly, and never clear the form or show success on an uncertain response. These controls improve usability but do not replace server idempotency, database transactions, unique constraints, or webhook verification.

## Current preview limits

The frontend demo uses this browser's local storage so its form-to-manager interactions can be reviewed. It is not an acceptable production database or security boundary; other people with access to the browser profile can inspect or alter it. No real messages are published, emails sent, payments accepted, or staff authenticated by this frontend. Use fictional values only until the backend and privacy review are in place.
