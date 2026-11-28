# mindsupport psychotherapy ltd — Interactive Prototype

A front-end prototype based on the supplied PRD and brand assets. The visitor and admin experiences run together in one browser page so the end-to-end demo can share fictional records.

## Preview path

Open `index.html` in a modern browser. The prototype uses a shared inline SVG icon set for navigation, booking, and admin controls.

## Open and walk through it

1. Open `prototype/index.html` in a modern browser.
2. Use **Anonymous Message** and submit fictional text.
3. Scroll to the footer and select **Admin dashboard demo**.
4. In **Messages**, open the new record, mark it reviewed, or publish an edited excerpt after checking the permission box.
5. Return to the visitor page and open **Reflections** to see approved demo excerpts.
6. Try either booking route. Requests appear in **Leads & bookings** for staff follow-up.
7. Contact the person and agree the session details before marking a request confirmed.
8. Use **Reset demo data** in the admin header to restore the fictional examples and clear locally entered demo records.

## What the admin prototype demonstrates

- Anonymous message inbox with status, source, timestamp, and review controls
- Separate consultation leads with modality, requested time, and optional concern tag
- Session enquiry follow-up and confirmation states; no payments are collected in the current launch scope
- Reflection review and publishing workflow, with a consent/privacy gate
- Branded reflection card PNG download after the admin checks permission
- Campaign source view and a visual explanation of the intended data pipeline

New demo records are stored in this browser’s local storage so the visitor flow can be seen in the admin view. Use fictional details only. The prototype sends no data to a server, email provider, Google Sheet, payment provider, or analytics service. Browser storage behavior for local files can vary; if persistence is unavailable, the data still works for the current open page session.

## Production readiness

This root folder is still the standalone demo prototype. The separate Next.js frontend is in `frontend/`, with the Express/PostgreSQL/Prisma API in `backend/`. The frontend source now calls public booking/message/subscriber/reflection endpoints and has a staff sign-in workspace; these changes are not deployed yet. The Railway migrations have not been applied, and Paystack, Resend, Apps Script delivery, and actual availability management are still pending. The dashboard in this root prototype remains open and uses local demo data; never use it for real client records.

Current launch target: Vercel for the Next.js frontend and Railway for the Express API and PostgreSQL. The site captures leads and session requests; staff contact each person, agree the details, and confirm the request. No payment is collected on the website. Paystack schemas and verification code remain dormant for a later phase. Resend and Google Apps Script/Sheets can be connected for lead communication and reporting after the client confirms requirements. See [`backend/README.md`](./backend/README.md) and [`frontend/BACKEND_INTEGRATION.md`](./frontend/BACKEND_INTEGRATION.md) for the implementation boundaries.

The PRD describes anonymous messages without identity/IP markers and separately asks for client IP collection for leads. Agree the real privacy, consent, retention, access, and publication rules before implementing the backend. Clinician credentials, service location, appointment availability, and business contact details also need firm-approved values before launch.

Google Apps Script source, spreadsheet setup, signed webhook contract, and Railway connection notes are in [`integrations/google-apps-script/README.md`](./integrations/google-apps-script/README.md). The receiver is not deployed or connected yet.



