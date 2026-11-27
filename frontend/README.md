# Mindsupport frontend

This is the separate production frontend work area for Mindsupport Psychotherapy Ltd. The existing website prototype is at the repository root and remains separate while this frontend and the backend are being completed.

## Run the development preview

```powershell
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The WIP tracker is at `http://localhost:3000/work-in-progress`.

## Review routes

- `/` — visitor home and support pathways
- `/start` — choose the free discovery call or direct-session pathway
- `/book` — free introductory call request preview
- `/sessions` — paid direct-session booking preview
- `/say` and `/say/[slug]` — anonymous message and campaign entry previews
- `/message` — anonymous message preview
- `/reflections` — example public reflections layout, using illustrative copy only
- `/manager` — practice manager dashboard layout, using fictional records only
- `/work-in-progress` — build status and review links

Current forms are frontend-only. They save fictional demo data to this browser's local storage; they do not send it to a server. Do not use real client information. The tracker and expanded backend/security handoff are in [WORK_IN_PROGRESS.md](./WORK_IN_PROGRESS.md) and [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md).

## Checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Preview deployment

The current target is Vercel for this Next.js frontend, with the project root set to `frontend`. The current architecture pairs it with the Express API and PostgreSQL hosted on Railway and Paystack for payments. Store frontend-only public configuration in Vercel environment variables; keep database URLs and Paystack secret keys only in the Railway backend environment. Never use a `NEXT_PUBLIC_` variable for a secret. Keep the existing production project and custom domain pointed at the root prototype until the PRD scope, backend integration and security review are complete and production cutover is explicitly approved.
