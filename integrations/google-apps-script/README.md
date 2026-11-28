# Mindsupport Google Sheets and Gmail receiver

This is a downstream receiver for the Railway API. It creates a spreadsheet with free-call leads, verified paid bookings, checkout-recovery delivery records, and webhook receipts. It is not connected to the app or deployed by this repository change.

## Data and trust boundaries

- PostgreSQL on Railway remains authoritative. Send `booking.paid` only after the backend has verified the Paystack transaction and committed the booking/payment change. A browser redirect or a direct Apps Script request must never mark a booking paid.
- `payment.abandoned` is sent by a backend outbox job only after the booking is still unpaid at least 30 minutes after checkout creation. Apps Script sends the reminder only when the event contains `recoveryEmailConsent: true` and the checkout URL is HTTPS on a `paystack.com` host.
- `lead.created` is currently limited to a free-call lead. Coarse tags and campaign attribution are allowed; do not send form essays or sensitive free-text disclosures.
- Anonymous-message events are not accepted, and there is no anonymous-message tab. Do not add sender identity, email, IP, or a join key to that pipeline.
- The PRD mentions verified client IP on lead records. The sheets have an optional IP column, but leave it blank unless the firm approves a lawful purpose, access controls, and a retention period. Do not use IP for anonymous messages.
- A Google Sheet is editable by its owner, so it is not literally immutable. Restrict editor access, protect ranges where useful, enable Google Workspace audit controls if available, and define retention before adding real client records.
- `WebhookReceipts` makes Sheets writes idempotent by event ID. The email status is retried when the same event is redelivered, but no email system can guarantee exactly-once delivery across a crash between sending and recording success. Keep authoritative delivery jobs in the backend outbox and monitor failures.

## Create the spreadsheet and deploy the web app

1. Sign in to the Google account that should own the workbook. Create a new Apps Script project at `https://script.google.com/` and paste `Code.gs` into its editor. Keep the V8 runtime enabled.
2. Save, select `setupMindsupportSheets`, and click **Run**. Review Google's authorization prompt. The function creates the workbook and tabs, stores the spreadsheet ID in Script Properties, and prints the workbook URL in the execution log. Share the workbook only with staff who need access.
3. Open **Project Settings → Script Properties**. Add:
   - `WEBHOOK_SECRET`: a random secret with at least 32 characters.
   - `ADMIN_EMAIL`: the restricted firm inbox for new free-call and paid-booking notifications.
   `SPREADSHEET_ID` is set by the setup function. Do not put these values in source control or the frontend.
4. Generate a secret locally, for example with Node.js: `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Copy the same value into Apps Script `WEBHOOK_SECRET` and Railway `GOOGLE_APPS_SCRIPT_SHARED_SECRET`. Do not paste it into chat or commit it.
5. In the Apps Script editor, choose **Deploy → New deployment → Web app**. Set **Execute as** to the workbook-owning account and access to **Anyone** so Railway can call it without an interactive Google login. The endpoint is publicly reachable, but accepts only signed, timestamped requests. Copy the `/exec` URL into Railway `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`.
6. Deploy changes as a new version and update the Railway endpoint if Google gives you a new deployment URL. Apps Script web apps do not use environment variables; the Script Properties above are the server-side configuration.

The deployment account's Apps Script quotas apply to spreadsheet writes and `MailApp`. A delivery error returns JSON `{ "ok": false, "error": "..." }`; Apps Script web apps do not provide a reliable custom HTTP status code, so the Railway sender must inspect the JSON response as well as HTTP status.

## Event format and signature

`backend/src/google-apps-script.ts` contains the matching TypeScript signer and HTTPS sender. It is intentionally not wired into API routes yet. Call it only from a server-side outbox worker, never from browser code. Use a stable `eventId` for retries and a new nonce/timestamp/signature for each delivery attempt.

```json
{
  "eventId": "paid-booking:payment-attempt-uuid",
  "eventType": "booking.paid",
  "occurredAt": "2026-11-27T12:30:00.000Z",
  "timestamp": 1795782600,
  "nonce": "fresh-random-base64url-value",
  "data": {
    "bookingId": "booking-uuid",
    "paymentReference": "paystack-reference",
    "amountKobo": 1000000,
    "currency": "NGN",
    "service": "50-minute session",
    "durationMinutes": 50,
    "scheduledAt": "2026-12-01T10:00:00.000Z",
    "name": "Example Client",
    "email": "client@example.com",
    "phone": "",
    "source": "direct-session"
  },
  "signature": "base64url-hmac-sha256-without-padding"
}
```

The HMAC-SHA256 input is, in order, timestamp, nonce, event ID, event type, occurred-at time, and canonical JSON for `data`, joined with newline characters. Canonical JSON recursively sorts object keys. The receiver rejects stale timestamps (over five minutes), replayed nonces, unsupported event types, invalid schemas, and a reused event ID with a different payload hash. Payload size is limited to 16 KB. It also prefixes formula-leading cell text to prevent spreadsheet formula injection.

## Event data

### `lead.created`

```json
{
  "leadId": "lead-uuid",
  "leadType": "free_call",
  "name": "Example Client",
  "email": "client@example.com",
  "phone": "",
  "concernTags": ["stress"],
  "source": "free-call",
  "utm": { "source": "search", "medium": "organic", "campaign": "", "referrerHost": "example.org" },
  "verifiedClientIp": ""
}
```

Only send tags the client selected for the free-call form. Keep the optional client IP empty unless the firm's privacy review approves sending it.

### `booking.paid`

Required: `bookingId`, `paymentReference`, `amountKobo`, `currency: "NGN"`, `service`, `durationMinutes`, `name`, and `email`. Optional: `scheduledAt`, `phone`, `source`, and the privacy-reviewed `verifiedClientIp`. Current direct-session tiers are ₦10,000 / 50 minutes, ₦30,000 / 120 minutes, and ₦70,000 / 300 minutes; the receiver records amount in kobo (1,000,000 / 3,000,000 / 7,000,000). The server must validate the chosen amount against the booking and Paystack verification before emitting this event.

### `payment.abandoned`

Required: `bookingId`, `amountKobo`, `currency: "NGN"`, `service`, `email`, `name`, ISO `checkoutCreatedAt`, an HTTPS `checkoutUrl` hosted on `paystack.com`, and `recoveryEmailConsent: true`. The signed event timestamp must be at least 30 minutes after checkout creation. Emit only after a fresh server-side check confirms payment remains unpaid. Do not send payment recovery if the person has not agreed to the relevant follow-up or if payment state is uncertain.

## Backend connection point

The backend already has these Railway variable names in `backend/.env.example`:

- `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`
- `GOOGLE_APPS_SCRIPT_SHARED_SECRET`

After booking/payment routes and a durable outbox are implemented, enqueue a distinct export/notification job in the same database transaction as the relevant state change. A worker can then call `deliverAppsScriptEvent(...)`; on any timeout, non-JSON response, or `{ "ok": false }`, retry with the same event ID and a freshly signed nonce. Do not block or roll back a verified payment because Sheets or email is temporarily unavailable.

No Apps Script URL or secret is configured in this repo. No real data is sent until you deploy the script and wire the outbox worker.
