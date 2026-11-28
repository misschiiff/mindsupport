# Mindsupport backend foundation

This is the backend for the lead-capture launch. Vercel hosts the Next.js frontend; Railway hosts this Express API and PostgreSQL. The site collects consultation/session requests and anonymous messages. Staff contact people, agree availability and confirm requests in the authenticated manager workspace. The website does not collect payments at launch. Paystack schema, configuration placeholders and signature-verification code remain dormant for a later phase; no checkout or payment status route is active. Resend and Google Apps Script/Sheets can be connected later for approved notifications/reporting. PostgreSQL remains the source of truth. Provider secrets belong only in the Railway service environment.

## Current scope

- Express API process with Helmet, bounded JSON bodies, strict CORS and mutation-origin checks, API/auth rate limits, liveness health, and DB-aware readiness routes.
- Prisma/PostgreSQL data model for leads, slots, non-financial session requests, future payment attempts, idempotency records, anonymous messages, separate subscribers, reflection likes, staff sessions and audit events.
- A standalone Paystack signature-verification helper with tests for raw-body integrity, stale timestamps, key rotation, and the legacy signature format. It is not connected to a webhook route yet.
- A matching Google Apps Script HMAC signer/delivery helper at `src/google-apps-script.ts`. It is not wired to routes or an outbox yet; source and deployment instructions are in `../integrations/google-apps-script/`.
- Public request endpoints at `/api/public/free-call`, `/api/public/sessions`, `/api/public/messages`, `/api/public/subscribers`, `/api/public/reflections`, and `/api/public/reflections/:id/like`. They validate input, use idempotency keys, rate limits and honeypot checks, and verify Turnstile in production. Anonymous messages contain no contact or IP field.
- Checked-in SQL migrations and a Prisma deploy command. The migrations have not been applied to Railway. The local `DATABASE_URL` currently fails Prisma's PostgreSQL URL validation, so do not run migrations from this machine until its target is confirmed.
- Staff login/logout/session inspection endpoints under `/api/auth`, opaque database-backed sessions, HttpOnly cookies, hashed session tokens, scrypt password hashes, persistent per-account lockout, allow-listed staff roles, and audit events.
- One-time staff bootstrap command (`pnpm admin:create`). There is no public staff registration or password reset flow.
- Environment variable example only. No credentials or production database are configured.

## Local setup

1. Copy `.env.example` to `.env` and set a local PostgreSQL URL. `DATABASE_URL` is required by Prisma CLI validation/generation; schema validation does not connect to the database.
2. Install packages with `pnpm install`.
3. Generate Prisma Client with `pnpm db:generate`.
4. Validate schema with `pnpm db:validate`.
5. Apply migrations to the local development database with `pnpm db:migrate:dev`; use `pnpm db:migrate:deploy` for the checked-in migration.
6. Set `ADMIN_BOOTSTRAP_EMAIL` and a unique `ADMIN_BOOTSTRAP_PASSWORD` in the private local `.env`, then run `pnpm admin:create` once.
7. Start the API with `pnpm dev`. `/health` checks process liveness; `/ready` also verifies the database connection.

## Work not yet implemented

The public visitor forms and protected management workspace now have API routes in source, but are not live until Railway migrations and the Vercel API configuration are deployed. The first staff account still needs to be bootstrapped. MFA, password recovery, Paystack transaction creation/webhooks, payment reconciliation, Resend notifications, a durable outbox/Apps Script delivery worker, analytics, and Cloudflare edge configuration are outstanding. The current forms must not be treated as confirmed bookings or payments: schedule confirmation, availability enforcement and verified checkout are not implemented yet.

## Railway and Vercel environment setup

- In Railway, configure the API service **Root Directory** as `/backend`, build command `pnpm build`, start command `pnpm start`, and pre-deploy command `pnpm db:migrate:deploy`.
- In that Railway API service's Variables, set `DATABASE_URL` using the Postgres service's private reference variable (for a database service named `Postgres`, commonly `${{Postgres.DATABASE_URL}}`). Do not enable PostgreSQL public access. Set `FRONTEND_ORIGIN` to the exact production site origin including `https://` and any `www`, set `COOKIE_SECURE=true`, and set `COOKIE_SAME_SITE=none` when using the Railway `.up.railway.app` API origin. Configure `CLOUDFLARE_TURNSTILE_SECRET_KEY` only in Railway.
- Deploy the API service. After it is listening, generate a Railway domain on the **API service** (Settings → Networking → Public Networking). Do not generate a domain for Postgres. Check `/health` and `/ready`; `/ready` must report the database connected and the deployment must show the migrations completed.
- In Vercel, set `NEXT_PUBLIC_API_BASE_URL` to the Railway API origin (no trailing slash) and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to the public Cloudflare site key. Redeploy the frontend after adding these variables. Set the matching Turnstile secret only in Railway.
- Keep `DATABASE_URL`, Paystack keys, Turnstile secret, Resend key, and Apps Script shared secret only in Railway's server environment. Never prefix secrets with `NEXT_PUBLIC_`.
- Generating a Railway domain exposes the API publicly; it does not create tables. The Prisma pre-deploy migration creates tables. The API exposes health/readiness, staff auth, public form/reflection routes, and staff-authorized workspace routes. Payment links and actual payment verification are deliberately disabled until Paystack is configured.
- The example reserves configuration for Cloudflare Turnstile, Resend email and the Google Apps Script paid ledger. Integrations other than the standalone payment signature verifier are not live yet.
- Use a one-time private Railway command/job with `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` to create the first staff account after migrations. Remove/unset bootstrap values immediately afterward. The script refuses to overwrite an existing account.

Before implementing slot selection, confirm actual clinician availability, timezone, slot duration/overlap rules, and how any session credits expire. The schema intentionally treats slots as explicit rows so the booking transaction can atomically claim one slot; no public availability is invented here.
