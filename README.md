# STAR SINGERS 2026 — Website & Registration Backend

Website: https://www.jkjcreations.org  
Repository: https://github.com/ojilztag/Star-Singers-2026

## Registration workflow
1. Participant submits one individual entry and ₹500 fee consent.
2. Participant selects one image, adjusts the square crop, and confirms it.
3. The browser submits both the original image and cropped 800×800 image.
4. Participant submits UTR and payment proof.
5. Apps Script writes the registration to Google Sheets and saves all files in private Drive folders.
6. Organiser manually checks bank/UPI credit and approves or rejects.
7. Participant ID is generated only after approval: `JKJ-CC26-M-001`, `002`, etc.
8. Admin can search records, review documents, add notes, manage notices and change password.

No group entry and no camera feature.

## Google Sheets created by setupStarSingersBackend()

Spreadsheet: **STAR SINGERS 2026 — Registration Database**

- **Dashboard** — live formulas for total registrations, payment pending, review pending, approved, rejected, verified collection and pending amount.
- **Registrations** — one row per participant: tracking ref, Participant ID, submission date, name, own parish/diocese, residence, WhatsApp, entry type, fee, UTR, cropped photo ID/URL, original photo ID/URL, payment proof ID/URL, payment status, registration status, admin note, reviewed timestamp and reviewer.
- **Payment Reconciliation** — live QUERY view of submission date, tracking ref, participant, UTR, fee and payment status. It is a reconciliation aid, not proof of bank credit.
- **Notices** — notice ID, timestamps, title, body, publish date, status and editor.
- **AuditLog** — timestamp, admin, action, record ID and details.
- **Settings** — event title, ₹500 fee, individual-entry rule, ID prefix, manual verification rule and photo storage note.

## Google Drive folders
Private root folder: **STAR SINGERS 2026 — PRIVATE FILES**
- **Cropped Participant Photos** — website/entry-card image.
- **Original Participant Photos — Admin Only** — original upload for organiser checking.
- **Payment Proofs — Admin Only** — payment receipt/screenshot.

The script does not make these files public. An admin must have Drive access to open the links.

## First-time setup (must be completed by the organiser)
1. Open the Google Apps Script project intended for this event and replace its code with the repository's current `Code.gs`.
2. Save and run `setupStarSingersBackend()` once. Authorise Google Sheets and Drive access.
3. Open the execution log. Copy the generated spreadsheet URL and private Drive folder URL and keep them secure.
4. Apps Script → Project Settings → Script Properties: add `ADMIN_USER` and `ADMIN_PASSWORD`. Use a unique password of at least 12 characters.
5. Run `initializeStarSingersAdmin()` once. It hashes the password and removes the plaintext password property.
6. Deploy → New deployment → Web app. Choose **Execute as: Me** and **Who has access: Anyone** so the public registration form can submit. Admin functions still require server-side login.
7. Copy the Web App URL ending in `/exec`.
8. Replace `PASTE_STAR_SINGERS_APPS_SCRIPT_EXEC_URL_HERE` in both `backend-client.js` and `admin.html` with that exact URL.
9. Publish the website files.
10. Submit a controlled test registration. Confirm one row appears and three files are saved privately (cropped photo, original photo, payment proof). Test Admin login, search, approval and ID generation before announcing registration.

## Security and operating rules
- Never share the private Drive root folder publicly.
- Never put admin credentials in website files or GitHub.
- Payment is manually verified. An uploaded screenshot or UTR alone is not confirmation of credit.
- Replace the demo payment QR with the official QR before accepting real registrations.
- Existing rows cannot have original images retroactively. This schema is intended for the new empty spreadsheet.
- Do not rerun `setupStarSingersBackend()` after successful setup; it intentionally refuses to overwrite an existing backend. An existing populated sheet requires a separate migration before adopting this changed schema.

## Main files
- `index.html` — public event website, form and photo crop editor.
- `backend-client.js` — public registration bridge.
- `admin.html` — admin dashboard.
- `Code.gs` — Apps Script API, Sheets and Drive setup.
