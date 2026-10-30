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
6. Try either booking route. A booking appears in **Leads**; a direct therapy session also creates a pending item in **Payments**.
7. In **Payments**, simulate a checkout or recovery follow-up. These actions do not move money or send email.
8. Use **Reset demo data** in the admin header to restore the fictional examples and clear locally entered demo records.

## What the admin prototype demonstrates

- Anonymous message inbox with status, source, timestamp, and review controls
- Separate consultation leads with modality, requested time, and optional concern tag
- A payment ledger with pending, paid, and 30-minute abandoned recovery states
- Reflection review and publishing workflow, with a consent/privacy gate
- Branded reflection card PNG download after the admin checks permission
- Campaign source view and a visual explanation of the intended data pipeline

New demo records are stored in this browser’s local storage so the visitor flow can be seen in the admin view. Use fictional details only. The prototype sends no data to a server, email provider, Google Sheet, payment provider, or analytics service. Browser storage behavior for local files can vary; if persistence is unavailable, the data still works for the current open page session.

## Production readiness

This is not the production application. The PRD’s Next.js, Node/Express, PostgreSQL/Prisma, Google Apps Script, and Paystack services are not implemented. The dashboard simulates those workflows with local demo data. Admin access is intentionally open in this preview and is not protected by a production login.

The PRD describes anonymous messages without identity/IP markers and separately asks for client IP collection for leads. Agree the real privacy, consent, retention, access, and publication rules before implementing the backend. Clinician credentials, service location, pricing, appointment availability, and business contact details also need firm-approved values before launch.



