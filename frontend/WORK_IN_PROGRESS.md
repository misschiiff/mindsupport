# Mindsupport frontend work in progress

This is the production frontend work area, separate from the existing root-level prototype that the public website currently serves. Do not switch the existing production site to this app until the PRD scope is complete and the backend has been connected and reviewed.

Review the current screens locally at `/`, `/book`, `/message`, and `/work-in-progress`.

## Progress

| Area | State | Notes |
|---|---|---|
| Production frontend scaffold | Complete | Next.js App Router under `frontend/`. |
| Visitor home and responsive navigation | Ready for review | Branded page, desktop navigation, circular mobile menu, care approach, entry points. |
| Introductory call request | Frontend preview | Includes support type, online / in-person / either, day and time preferences, contact details, validation, consent. No delivery or storage. |
| Anonymous message | Frontend preview | No name or email fields; consent and minimum length validation. No delivery or storage. |
| Campaign-specific anonymous entry | Frontend preview | `/say/[slug]` displays a campaign label; no attribution database or visitor tracking exists. |
| Public reflections | Illustrative preview | `/reflections` uses invented sample copy, not visitor submissions. |
| Practice manager dashboard | Sample-data preview | Visual inbox and requests overview only; authentication and real records are not implemented. |
| Secure booking and anonymous message delivery | Not started | Requires backend, access control, retention policy, privacy review and operational notifications. |
| Full PRD mapping | In progress | Verify page copy, exact services and all states against the source PRD before public launch. |
| Automated frontend checks | Complete for current preview | Form-validation tests, lint, type check and production build pass. End-to-end backend tests remain for the integration stage. |

## Safe preview behavior

The current browser forms are visual/interaction previews only. They do not submit requests, write data to local storage, create a booking, or save messages. The `/manager` screen is an unprotected visual mock with fictional rows only; it has no sign-in and no client information. The WIP status page is also not password-protected. Use sample values only, and do not enter confidential information in any preview route.

## Next implementation stages

1. Reconcile all visitor content, form fields, consent language, edge cases and responsive states with the PRD.
2. Build the practice manager screens against agreed role and record workflows, using synthetic sample data only.
3. Connect the reviewed frontend to a secure backend, add end-to-end tests for real persistence/delivery, and perform deployment/privacy review.

## Open PRD decisions before backend activation

- Confirm firm-specific services, clinician credentials, contact information, policies, session length, prices and available times; the PRD does not supply these operational values.
- Reconcile the PRD's booking client-IP / metadata logging with its anonymous-message pipeline that drops IP markers. Anonymous message handling must not acquire identifying data through an analytics shortcut.
- Define consent wording, record retention, administrator roles, message moderation, audit access and lawful basis before persisting therapy-related information.
- Confirm payment failure/abandoned-checkout email behavior and webhooks before enabling payment collection.

Keep the existing production website attached to its current prototype until stage 3 is complete and the full app is accepted.
