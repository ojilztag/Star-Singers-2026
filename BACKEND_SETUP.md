# STAR SINGERS 2026 — Google Sheets + Drive Backend Setup

This is a separate backend for **NAKSHATHRA GAYAKAR – STAR SINGERS 2026**. It does not reuse CAROLIA's spreadsheet, Drive folders, registration IDs or admin credentials.

## What is included
- `Code.gs`: Google Apps Script API, Sheets database, private Drive uploads, admin authentication, manual payment review, ID generation, notices and audit log.
- `backend-client.js`: sends the existing public registration form and both uploaded files to Apps Script.
- `admin.html`: Admin login, dashboard, search, participant/payment proof Drive links, approve/reject, WhatsApp share and notices management.
- `notices-data.js` + `notices.html`: public published notices feed.

## A. Create the Google backend
1. Sign in to the Google account that will own the event records.
2. Open https://script.google.com/ and create a New project named `STAR SINGERS 2026 Backend`.
3. Replace the editor's contents with this repository's complete `Code.gs`. Save.
4. In Project Settings → Script Properties, add `ADMIN_USER` = the admin username and `ADMIN_PASSWORD` = a strong password of at least 12 characters.
5. Run `setupStarSingersBackend` once. Approve Google Sheets and Drive permissions. It creates a new spreadsheet with `Registrations`, `Notices`, and `AuditLog` tabs, plus a private Drive folder with `Participant Photos` and `Payment Proofs` subfolders. It stores the generated IDs in Script Properties and logs the spreadsheet and folder URLs.
6. Run `initializeStarSingersAdmin` once. It hashes the password and removes the plaintext `ADMIN_PASSWORD` property. Do not run it again.
7. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone (public form submissions need this; admin actions still require the server-side session token). Deploy and copy the Web app URL ending in `/exec`.

## B. Connect the website to Apps Script
Replace `PASTE_STAR_SINGERS_APPS_SCRIPT_EXEC_URL_HERE` with the deployed `/exec` URL in `backend-client.js`, `admin.html`, and `notices-data.js`. Commit the changes to GitHub. Whenever `Code.gs` changes, deploy a New version in Apps Script. The `/exec` URL usually remains the same when editing the existing deployment.

## C. Registration workflow
1. Participant completes the existing form and pays the displayed ₹500 fee.
2. Participant uploads their photo, payment screenshot/receipt and enters UTR.
3. Apps Script saves the form record in `Registrations`, and uploads both files to private Drive folders.
4. The application is marked `Pending Verification` / `Pending Review`. No official Participant ID is issued yet.
5. Admin opens `/admin.html`, logs in, reviews the details and opens the two private Drive links.
6. Admin checks the payment in the UPI/bank account independently, then selects **Approve & Generate ID** or **Reject**.
7. On approval, the backend generates a unique `JKJ-CC26-M-001, JKJ-CC26-M-002, JKJ-CC26-M-003, and onward` ID. Admin can share the participant's ID and details through the device share sheet / WhatsApp.

**Payment screenshot and UTR are not automatic payment verification.** The organiser must confirm the actual credit in the bank/UPI account before approval.

## D. Notices
Admin can create a Draft, Published or Archived notice. Only Published notices appear on the public Notices page. Public notices are read from the `Notices` sheet; no manual editing of `notices-data.js` is required after the endpoint is connected.

## E. File handling and privacy
- Files are stored in private Drive folders owned by the Apps Script account. They are not made public.
- Admin sees **View Participant Photo** and **View Payment Proof** links. The browser must be signed into the Google account that owns the files (or another account explicitly granted access).
- Each file must be 3 MB or smaller. Accepted participant photo formats: JPG, PNG, WebP, HEIC. Payment proof: image or PDF.
- Keep the spreadsheet and Drive folder private. Do not publish their URLs.
- Keep the admin password private. Do not put it in GitHub or website JavaScript.
- The website currently asks for one individual entry and a ₹500 fee. Confirm the event's final privacy/retention policy before collecting real participant data.

## F. Test checklist before opening registration
- Submit one clearly labelled test registration with a test photo and test payment receipt.
- Confirm one row appears in `Registrations`.
- Confirm both files appear in their private Drive subfolders and open for the authorised admin.
- Confirm the admin dashboard shows the pending record and its two file links.
- Approve the test record and confirm it receives one `JKJ-CC26-M-001, JKJ-CC26-M-002, JKJ-CC26-M-003, and onward` ID.
- Search by ID/name/phone and test the WhatsApp share action.
- Publish a test notice and confirm it appears on the public Notices page.
- Delete test data only after verifying the workflow; do not delete real entries.

## Important current limitation
The code has been committed to GitHub, but the Apps Script project has **not** been deployed from the user's Google account in this workflow. Until the setup steps are completed and the real `/exec` URL is added to the three frontend files, the website will not save registrations or uploads. Do not announce registration as live before completing the checklist.