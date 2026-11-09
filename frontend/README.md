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

Current forms are frontend-only. They do not send or save information; use sample data while reviewing. The tracker and expanded handoff notes are in [WORK_IN_PROGRESS.md](./WORK_IN_PROGRESS.md).

## Checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Preview deployment

To preview independently on Vercel, configure a separate preview project or branch deployment with the project root set to `frontend`. Keep the existing production project and custom domain pointed at the root prototype until the full PRD scope is complete, backend integration and security review are finished, and production cutover is explicitly approved.
