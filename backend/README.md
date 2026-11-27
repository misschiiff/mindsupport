# Mindsupport backend foundation

This is the backend foundation, separate from the frontend preview. The PRD specifies Express on Railway, PostgreSQL with Prisma, Paystack, Google Apps Script/Sheets/Gmail and Cloudflare. The current project deployment decision is Vercel for the Next.js frontend, Railway for the Express API and PostgreSQL, Paystack for checkout, Resend for transactional email, and Google Apps Script/Sheets for the paid wholesale/accounting ledger. The backend will export a paid booking/registration to Sheets only after Paystack is authoritatively verified and the database transaction commits; PostgreSQL remains the source of truth. Resend delivery and Sheets exports must use retryable jobs and must not decide payment state. Vercel does not replace PostgreSQL; database and provider secrets belong only in the Railway service environment. Cloudflare configuration remains to be completed.

## Current scope

- Express API process with Helmet, bounded JSON bodies, strict CORS and mutation-origin checks, API/auth rate limits, liveness health, and DB-aware readiness routes.
- Prisma/PostgreSQL data model for leads, slots, bookings, registrations, payment attempts, idempotency records, unique webhook events, anonymous messages, separate subscribers, reflection likes, staff sessions and audit events.
- A standalone Paystack signature-verification helper with tests for raw-body integrity, stale timestamps, key rotation, and the legacy signature format. It is not connected to a webhook route yet.
- Initial SQL migration, Prisma deploy command, and database readiness endpoint (`/ready`). The migration is generated but has not been applied because no Railway database URL is configured in this workspace.
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

This scaffold is not ready for real submissions: the migration has not been applied to Railway; the manager UI is not wired to login; MFA and password recovery are not built; role-protected business APIs do not exist yet; and Turnstile Siteverify, Paystack transaction creation/webhook route, payment reconciliation, Resend notifications, Google Sheets outbox delivery, analytics and Cloudflare deployment remain to be built and tested. Do not deploy or enter real client data.

## Railway and Vercel environment setup

- In Railway, attach PostgreSQL and configure `DATABASE_URL` from its private Postgres connection variable, plus `FRONTEND_ORIGIN` set to the exact deployed Vercel origin. Set `COOKIE_SECURE=true`; use `COOKIE_SAME_SITE=none` for cross-site Vercel/Railway cookie requests. Set proxy trust only to Railway's documented trusted proxy chain.
- Run `pnpm db:migrate:deploy` as a Railway pre-deploy/release command before starting the API. Do not migrate production from a developer laptop.
- Set the public API base URL as a Vercel frontend environment variable; it is an origin, not a secret. Keep `DATABASE_URL`, Paystack keys, Turnstile secret, Resend key, and Apps Script shared secret only in Railway's server environment. Never prefix secrets with `NEXT_PUBLIC_`.
- The example reserves configuration for Cloudflare Turnstile, Resend email and the Google Apps Script paid ledger. Integrations other than the standalone payment signature verifier are not live yet.
- Use a one-time private Railway command/job with `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` to create the first staff account after migrations. Remove/unset bootstrap values immediately afterward. The script refuses to overwrite an existing account.

Before building booking endpoints, confirm actual clinician availability, timezone, slot duration/overlap rules, and how the three included sessions expire. The schema intentionally treats slots as explicit rows so the booking transaction can atomically claim one slot; no public availability is invented here.
