# Mindsupport frontend work in progress

This is the production frontend work area, separate from the existing root-level prototype that the public website currently serves. Do not switch the existing production site to this app until the PRD scope is complete and the backend has been connected and reviewed.

Review the current screens locally at `/`, `/book`, `/sessions`, `/say`, `/reflections`, `/manager`, and `/work-in-progress`.

## Progress

| Area | State | Notes |
|---|---|---|
| Production frontend scaffold | Complete | Next.js App Router under `frontend/`. |
| Visitor home and responsive navigation | Built · final PRD review pending | Shared green glass navigation, single Manrope type family, persistent anonymous and booking actions, responsive menu, and in-place section anchors. |
| Animated visitor route sheets | Implemented and browser-checked | Book a free call, Book a session, Reflections, Start, /message, /say and campaign message routes slide over the preserved home context. Header stays visible; sheet content scrolls independently; Escape, backdrop, close button, and browser history dismiss it. Direct URLs and refreshes render complete pages. |
| Introductory call request | Interactive local preview | Three progressive steps with only meeting format, preferred availability, name/email and follow-up consent. Reassurance is below the form. Fictitious details create a local demo lead and call request; no network delivery. |
| Anonymous message publication consent | Interactive local preview | Message box first, brief mandatory publication consent and send action. No sender contact fields. A valid fictional message enters the local manager review queue. No network delivery. |
| Campaign-specific anonymous entry | Frontend preview | `/say/[slug]` displays a campaign label; no attribution database or visitor tracking exists. |
| Public reflections | Interactive local preview | Illustrative samples are clearly identified. Manager-approved excerpts appear in the local preview feed; an email opt-in card appears after each six cards. |
| Reflection engagement | Interactive local preview | Each card has a like toggle/count and branded PNG download. Like state is saved in this browser only; site-wide aggregation needs backend storage. |
| Analytics dashboard | UI preview · provider integration pending | Manager view includes traffic/source/funnel placeholders and age-bracket reporting. GA4 and Cloudflare Web Analytics setup is a backend/production configuration task; no live traffic data is connected here. |
| Backend foundation | Auth and migration prepared | Express service, PostgreSQL/Prisma schema, generated initial SQL migration, DB readiness endpoint, login/logout/session endpoints, hashed sessions/passwords, HttpOnly cookie policy, origin checks, per-IP rate limiting, account lockout, role gate and audit records are implemented. The migration has not been applied to Railway; no database credentials are configured in the workspace. Staff UI, MFA/recovery, protected business APIs and provider integrations remain. |
| Deployment services | Target architecture documented | Vercel for Next.js frontend; Railway for Express API and PostgreSQL; Paystack for checkout; Google Apps Script/Sheets for a downstream wholesale ledger of backend-verified paid bookings/registrations; Resend for transactional email. PostgreSQL remains authoritative. Cloudflare WAF/Turnstile still requires configuration. Secrets stay server-side in Railway and must never use `NEXT_PUBLIC_`. |
| Reflections email capture | Interactive local preview | Required consent and one email field. Subscribers are separately stored with a coarse `reflections` source and no message ID/content/reply contact. No welcome email or unsubscribe action is active until backend integration. |
| Practice manager dashboard | Interactive local preview | Overview, message review/publication, leads/bookings, demo payment states, Reflections, subscribers and campaign-source sections. Staff login, secure database, real payment/email actions remain backend work. |
| Direct sessions and membership | Interactive local preview · business details pending | Opens on a focused one-off session form: name/email, 30/50/60 minutes, ₦10,000, no registration. Membership is a separate path with monthly ₦10,000 and six-month ₦60,000 options and three included sessions after verified registration. Yearly/lifetime prices and session availability remain unconfirmed. |
| Admin authentication and role access | Not built | `/manager` is unprotected; production login and authorization are backend-dependent. Never use it for client records. |
| Bot protection and request security | Baseline headers added · backend/Cloudflare controls pending | Frontend sends no real data today. Production requires Cloudflare WAF/rate limits, server-validated Turnstile, authentication, authorization, API validation, CSP and secure cookies. DDoS or attacks cannot be guaranteed impossible. |
| Secure booking and anonymous message delivery | Not implemented | Requires backend endpoints, access control, retention policy, privacy review and operational notifications. Backend contract covers idempotent requests/payments, authoritative webhook state, atomic slot holds and complimentary-session use, retries, and reconciliation. |
| Search and conversion content | Initial pass | Relevant page metadata, structured business data, helpful FAQ, and direct call/session choices. Domain, canonical URLs, exact services and verified therapist details still need confirmation. |
| Full PRD mapping | Frontend review in progress | Yearly/lifetime amounts, therapist and availability details, final page-by-page responsive/accessibility/content QA, and approved legal/operational copy remain. Authentication and verified payment are backend work. |
| SEO / AEO foundations | Initial frontend pass | Relevant page metadata, helpful FAQs, share descriptions and MedicalBusiness structured data. Confirm the real domain, area served, approved services, clinician details and policies before indexing. |
| Automated frontend/backend checks | Passing on current scaffold | Frontend typecheck, lint, five form-validation checks, and production build passed. Backend schema validation, TypeScript build, health/CORS smoke checks, and production dependency audit passed with no known vulnerabilities. Full integration, database and race-condition tests are still required. |

## Safe preview behavior

The visitor booking, anonymous-message and insights forms remain previews and do not deliver requests. They write local demo records to this browser so the manager workflow and Reflections review can be explored. Subscriber records are separate and contain no anonymous message ID or content. The `/manager` route is unprotected; checkout is non-paying; email/SMS sending is disabled. Use fictional sample values only. Do not enter real client contact details or confidential information in any preview route.

## Next implementation stages

1. Confirm the yearly and lifetime membership prices, therapist details and availability; wire those values into the session preview.
2. Complete page-by-page responsive/accessibility/content QA and confirm approved legal, contact and policy copy.
3. Continue the `../backend/` scaffold into secure APIs: protected staff access, PostgreSQL/Prisma records, API validation/rate limits, Cloudflare Turnstile verification, Apps Script/Gmail delivery, independent subscriber flow, Paystack signed-webhook verification, idempotency, atomic slot holds and credit reservations. Then run integration and launch review.

## Open PRD decisions before backend activation

- Confirm firm-specific services, clinician credentials, contact information, policies, session length, prices and available times; the PRD does not supply these operational values.
- Reconcile the PRD's booking client-IP / metadata logging with its anonymous-message pipeline that drops IP markers. Anonymous message handling must not acquire identifying data through an analytics shortcut.
- Define consent wording, record retention, administrator roles, message moderation, audit access and lawful basis before persisting therapy-related information.
- Confirm payment failure/abandoned-checkout email behavior and webhooks before enabling payment collection.
- Confirm yearly and lifetime registration prices and whether the three included sessions apply once per membership term or renew for each renewal period.

Keep the existing production website attached to its current prototype until stage 3 is complete and the full app is accepted.

## Prototype-to-production and PRD audit

| Requirement / behavior | Prototype | Production frontend | Production gap / decision |
|---|---|---|---|
| Floating translucent navigation rail | Green glass pill, fixed at the top; persistent Anonymous Message and consultation actions; mobile menu opens in-place. | Shared header now uses the same green glass pill and both call/session actions; mobile menu closes after selecting a destination. | Browser-checked at the production preview. |
| Sheet and motion behavior | About, reflections, anonymous message and booking content open in animated, independently scrolling sheets; buttons lift and compress. | Visitor routes now use Next.js parallel/intercepted routes with spring-like slide-in/out, dimmed background, separate scrolling, accessible close/Escape/backdrop and browser history. Section links scroll in place. | Browser-checked on Book a free call, Book a session, Reflections, Anonymous Message, and the homepage anchor. Hard navigation/refresh keeps each route shareable as a full page. |
| Anonymous message flow | Client-side demo entry appears in the manager inbox and can be reviewed. | Requires short publication consent; no sender contact fields; accepted demo text enters local review queue. | Local storage is not safe production storage. Never join the separately captured newsletter email to the message. |
| Manager workspace | Interactive demo inbox, review/publish states, booking leads and payment states. No authentication. | Sections now cover messages, leads/bookings, payments, Reflections, subscribers, and campaign sources. Manual lead entry and free-call demo leads work. | Authentication, audit trail, role authorization, persistent records, signed payment verification and delivery need the secure backend. |
| Reflection email capture | Separate preview list and feed card. | One email input and affirmative consent; post-message card does not receive a message identifier; feed card inserts after each sixth item. | No welcome mail is sent. Subscriber source is deliberately coarse and does not identify a particular message. |
| Security and data boundaries | Clearly labels demo-only local data and no network/email/payment calls; manager is intentionally unprotected and storage is local to the browser. | Manager labels local demo data; baseline security headers are set; checkout preview cannot accept payment. | Neither implementation is safe for real client information. PRD requires rate limiting, sanitization, anonymous-message IP separation, protected staff accounts and verified payment webhooks before activation. |
| Lead logging and outreach | Simulates lead records, payment pending/paid/abandoned states and the 30-minute recovery rule; no real email/payment is sent. | Leads and bookings persist in local browser demo storage; demo checkout explicitly takes no payment. Free-call demo state distinguishes saved from unsaved and does not claim an appointment was booked. | Sending payment links, recording real IP/contact data, provider verification and reminders remain blocked on retention/privacy decisions, manager permissions, backend records and Paystack integration. |
| Publication/SEO content | Public reflections can show only admin-approved, edited demo excerpts; FAQ and campaign routes. | FAQ, metadata, campaign route and sample reflection page exist, but no admin publishing connection. | Keep reflections synthetic until there is a consent-backed moderated publishing workflow. Confirm domain, services and clinician credentials before indexing. |

The supplied PRD has an important privacy split: anonymous messages must lose IP markers, while lead records request verified client IP. These must remain separate pipelines. Agree purpose, lawful basis, notice, retention and access before implementing lead IP logging. The frontend does not collect or link an insights opt-in to an anonymous message.
