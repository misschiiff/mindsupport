# Mindsupport frontend work in progress

This is the production frontend work area, separate from the existing root-level prototype that the public website currently serves. Do not switch the existing production site to this app until the PRD scope is complete and the backend has been connected and reviewed.

Review the current screens locally at `/`, `/book`, `/sessions`, `/say`, `/reflections`, `/manager`, and `/work-in-progress`.

## Progress

| Area | State | Notes |
|---|---|---|
| Production frontend scaffold | Complete | Next.js App Router under `frontend/`. |
| Visitor home and responsive navigation | Built · final PRD review pending | Shared green glass navigation, single Manrope type family, persistent anonymous and booking actions, responsive menu, and in-place section anchors. |
| Animated visitor route sheets | Implemented and browser-checked | Book a free call, Book a session, Reflections, Start, /message, /say and campaign message routes slide over the preserved home context. Sheets render in the document overlay layer, scroll independently, and close with Escape, backdrop, close button, or browser history. The header gives immediate route-change feedback. |
| Introductory call request | API-connected in source · deployment pending | Three progressive steps post to `/api/public/free-call` with validation, idempotency, Turnstile and consent. Records a lead and unscheduled free-call request. Not active on the live site until Vercel/Railway configuration and migration deployment. |
| Anonymous message publication consent | API-connected in source · deployment pending | Message text and mandatory publication consent post without sender contact or IP. A new message stays in moderation until staff publish an edited reflection. |
| Campaign-specific anonymous entry | Frontend/backend source | `/say/[slug]` source is recorded as coarse campaign metadata only; no sender identity or subscriber join. |
| Public reflections | Backend API in source · deployment pending | API exposes only staff-approved `reflectionText`; illustrative samples remain labeled. Subscriber card appears at intervals. |
| Reflection engagement | Backend API in source · deployment pending | Published-reflection likes use a pseudonymous per-reflection hash; branded PNG download remains client-side. |
| Analytics dashboard | UI preview · provider integration pending | Manager view includes traffic/source/funnel placeholders and age-bracket reporting. GA4 and Cloudflare Web Analytics setup is a backend/production configuration task; no live traffic data is connected here. |
| Backend foundation | Public and staff APIs built · Railway migration pending | Express/Prisma includes public form/reflection APIs, protected staff workspace APIs, login/logout, idempotency, Turnstile verification, role checks, audit records and schema migrations. The local database URL failed PostgreSQL URL validation; no migration has been applied to Railway. |
| Deployment services | Target architecture documented | Vercel for Next.js frontend; Railway for Express API and PostgreSQL; Paystack for checkout; Google Apps Script/Sheets for a downstream ledger of backend-verified paid bookings; Resend for transactional email. PostgreSQL remains authoritative. Cloudflare WAF/Turnstile still requires configuration. Secrets stay server-side in Railway and must never use `NEXT_PUBLIC_`. |
| Reflections email capture | API-connected in source · email delivery pending | Consent and one email field store a separate subscriber row with coarse source and no message ID/content/reply contact. Resend welcome and unsubscribe flows are not active. |
| Practice manager dashboard | Authenticated in source · migration/account pending | `/manager` now uses staff login and protected live-data APIs for leads, bookings, message review, reflections and subscribers. The manager cannot load until migrations and the first staff account are ready. Paystack actions remain disabled. |
| Direct session booking | API-connected in source · deployment pending | Server-owned tiers: 50 minutes for ₦10,000, 2 hours for ₦30,000, and 5 hours for ₦70,000. Requests create unscheduled bookings; no payment or appointment confirmation is claimed. |
| Admin authentication and role access | Built in source · Railway setup pending | `/manager` checks the backend staff session; API reads and writes require staff authorization. Bootstrap the first account privately after migrations. MFA and password recovery are still outstanding. |
| Bot protection and request security | Server-side controls implemented in source · keys/deployment pending | Public writes use server validation, rate limits, honeypot, idempotency and Turnstile Siteverify in production. Set the public Turnstile site key in Vercel and secret in Railway. |
| Secure booking and anonymous message delivery | Requests persist in source · launch dependencies remain | No slot is reserved and no payment is taken by the current session request API. Paystack, Resend, Apps Script outbox delivery, slot selection/availability, retention policy and final privacy review remain. |
| Search and conversion content | Initial pass | Relevant page metadata, structured business data, helpful FAQ, and direct call/session choices. Domain, canonical URLs, exact services and verified therapist details still need confirmation. |
| Full PRD mapping | Frontend review in progress | Direct-session pricing is recorded. Therapist and availability details, route-by-route responsive/accessibility/content QA, and approved legal/operational copy remain. Registration is deferred. Authentication and verified payment are backend work. |
| SEO / AEO foundations | Initial frontend pass | Relevant page metadata, helpful FAQs, share descriptions and MedicalBusiness structured data. Confirm the real domain, area served, approved services, clinician details and policies before indexing. |
| Automated frontend/backend checks | Passing on current scaffold | Frontend typecheck, lint, five form-validation checks, and production build passed. Backend schema validation, TypeScript build, health/CORS smoke checks, and production dependency audit passed with no known vulnerabilities. Full integration, database and race-condition tests are still required. |

## Safe preview behavior

The current source sends public submissions to the configured API and no longer falls back to local storage. Until the Railway database migrations and Vercel API settings are deployed, those requests will fail and must not be presented as received. The `/manager` screen is now sign-in gated, but requires a migrated database and bootstrapped staff account. No Paystack payment, welcome email, or recovery email is active yet.

## Next implementation stages

1. Configure the Railway API service and private Postgres reference, deploy migrations with `pnpm db:migrate:deploy`, generate a domain on the API service, and bootstrap the first staff account.
2. Set the Vercel API origin and Turnstile site key; configure the exact frontend origin and Turnstile secret in Railway. Then verify `/health`, `/ready`, sign-in, submissions, and the protected manager before enabling public submissions.
3. Implement Paystack checkout and signed webhook processing, Resend delivery, durable Apps Script export/recovery outbox, actual availability/slot management, and final privacy/retention review.

## Open PRD decisions before backend activation

- Confirm firm-specific services, clinician credentials, contact information, policies, session length, prices and available times; the PRD does not supply these operational values.
- Reconcile the PRD's booking client-IP / metadata logging with its anonymous-message pipeline that drops IP markers. Anonymous message handling must not acquire identifying data through an analytics shortcut.
- Define consent wording, record retention, administrator roles, message moderation, audit access and lawful basis before persisting therapy-related information.
- Confirm payment failure/abandoned-checkout email behavior and webhooks before enabling payment collection.
- Registration and membership are deferred; do not show them in the current booking or manager workflows.

Keep the existing production website attached to its current prototype until stage 3 is complete and the full app is accepted.

## Prototype-to-production and PRD audit

| Requirement / behavior | Prototype | Production frontend | Production gap / decision |
|---|---|---|---|
| Floating translucent navigation rail | Green glass pill, fixed at the top; persistent Anonymous Message and consultation actions; mobile menu opens in-place. | Shared header now uses the same green glass pill and both call/session actions; mobile menu closes after selecting a destination. | Browser-checked at the production preview. |
| Sheet and motion behavior | About, reflections, anonymous message and booking content open in animated, independently scrolling sheets; buttons lift and compress. | Visitor routes now use Next.js parallel/intercepted routes with spring-like slide-in/out, dimmed background, separate scrolling, accessible close/Escape/backdrop and browser history. Section links scroll in place. | Browser-checked on Book a free call, Book a session, Reflections, Anonymous Message, and the homepage anchor. Hard navigation/refresh keeps each route shareable as a full page. |
| Anonymous message flow | Client-side demo entry appears in the manager inbox and can be reviewed. | Requires short publication consent; no sender contact fields; accepted demo text enters local review queue. | Local storage is not safe production storage. Never join the separately captured newsletter email to the message. |
| Manager workspace | Interactive demo inbox, review/publish states, booking leads and payment states. No authentication. | Sections cover messages, leads/bookings, payments, Reflections, subscribers, and campaign sources. Manual lead entry and direct tier bookings work. | Authentication, audit trail, role authorization, persistent records, signed payment verification and delivery need the secure backend. |
| Reflection email capture | Separate preview list and feed card. | One email input and affirmative consent; post-message card does not receive a message identifier; feed card inserts after each sixth item. | No welcome mail is sent. Subscriber source is deliberately coarse and does not identify a particular message. |
| Security and data boundaries | Clearly labels demo-only local data and no network/email/payment calls; manager is intentionally unprotected and storage is local to the browser. | Manager labels local demo data; baseline security headers are set; checkout preview cannot accept payment. | Neither implementation is safe for real client information. PRD requires rate limiting, sanitization, anonymous-message IP separation, protected staff accounts and verified payment webhooks before activation. |
| Lead logging and outreach | Simulates lead records, payment pending/paid/abandoned states and the 30-minute recovery rule; no real email/payment is sent. | Leads and bookings persist in local browser demo storage; demo checkout explicitly takes no payment. Free-call demo state distinguishes saved from unsaved and does not claim an appointment was booked. | Sending payment links, recording real IP/contact data, provider verification and reminders remain blocked on retention/privacy decisions, manager permissions, backend records and Paystack integration. |
| Publication/SEO content | Public reflections can show only admin-approved, edited demo excerpts; FAQ and campaign routes. | FAQ, metadata, campaign route and sample reflection page exist, but no admin publishing connection. | Keep reflections synthetic until there is a consent-backed moderated publishing workflow. Confirm domain, services and clinician credentials before indexing. |

The supplied PRD has an important privacy split: anonymous messages must lose IP markers, while lead records request verified client IP. These must remain separate pipelines. Agree purpose, lawful basis, notice, retention and access before implementing lead IP logging. The frontend does not collect or link an insights opt-in to an anonymous message.
