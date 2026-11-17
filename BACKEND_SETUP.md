# STAR SINGERS 2026 — Google Apps Script Backend & Launch Checklist

Website: https://jkjcreations.org  
Repository: https://github.com/ojilztag/Star-Singers-2026

## Backend architecture

The public website is hosted from GitHub Pages. Registration, private file storage, admin authentication, payment review and notices use a separate Google Apps Script Web App backed by Google Sheets and private Google Drive folders.

Frontend files currently point to the deployed Web App URL in:
- `backend-client.js` — registration form submissions
- `admin.html` — admin dashboard actions
- `notices-data.js` — public Published notices
- `site-config.js` — public event settings controlled by the Admin Panel

Do not change the URL unless a new Apps Script deployment has been created and tested.

## One-time backend installation

Only do this if the Google Apps Script backend has not already been installed. **Do not run the installer against an existing live backend.**

1. Sign in to the Google account that should own the event records and private participant files.
2. Open https://script.google.com/ and create a new Apps Script project named `STAR SINGERS 2026 Backend`.
3. Copy the complete `Code.gs` file from this repository into the Apps Script editor and save.
4. Run `installStarSingers2026()` once. Approve the requested Google Sheets and Drive permissions.
5. Open the execution log and securely save the generated initial admin username and password. The generated password is shown during this one-time installation. Do not put it in GitHub or share it.
6. The installer creates the database tabs (`Registrations`, `Notices`, `AuditLog`, `Settings`, `Payment Reconciliation`, and `Dashboard`) and private Drive folders for cropped photos, original photos and payment proofs.
7. In Apps Script, select **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Deploy and copy the URL ending in `/exec`.
8. Confirm the URL matches the configured endpoint in all three frontend files listed above. If it differs, update all three files consistently.
9. Open the `/exec` URL in a browser. It should return the plain-text health response: `STAR SINGERS 2026 API is active.`

If a backend already exists, do not run `installStarSingers2026()` or `setupStarSingersBackend()` again. Inspect the existing Script Properties, spreadsheet and Drive folders first.

## Deploying backend code updates

Whenever `Code.gs` changes:
1. Open the existing Apps Script project that owns the configured `/exec` URL.
2. Replace its code with the reviewed repository version and save.
3. Select **Deploy → Manage deployments → Edit** on the existing Web App deployment.
4. Select **New version**, keep Execute as **Me** and access as **Anyone**, then deploy.
5. Re-test the health URL, a public notice read, admin login and a controlled test registration.

A GitHub commit or GitHub Pages deployment does **not** publish a new Apps Script version. The Apps Script deployment is a separate release step.

## Registration and payment workflow

1. Participant completes the individual registration form, provides a WhatsApp number with country code, participant photo, an exactly 12-digit numeric UTR and payment proof.
2. The current website/backend configuration specifies a ₹300 registration fee. The UTR / Transaction ID must be exactly 12 numeric digits. If payment is made from another person’s phone or UPI account, enter the UTR from that exact transaction so the payer can be identified and payment records are not mixed up.
3. The backend stores the registration in the private spreadsheet and uploads cropped photo, original photo and payment proof to private Drive folders.
4. New registrations remain **Pending Verification / Pending Review**. No Participant ID is issued at this stage.
5. Admin independently checks the actual bank/UPI credit. A screenshot or UTR alone is not proof of credited funds.
6. Admin verifies payment, then approves or rejects the registration.
7. On approval, the backend issues the next sequential Participant ID (for example `JKJ-CC26-M-001`). The public Entry Card must show the Participant ID only; internal tracking references must not be printed as a second ID.

## Admin-managed public event information

The Admin Panel includes an **Important Event Information · Website Content** editor. It controls registration fee, key dates, participation details, rules summary, prize details, video-submission instructions and organiser contact details. Values are stored in the existing `Settings` sheet; no new spreadsheet is required.

- Registration remains available; there is no Coming Soon / Closed switch or server-side status lock.
- The registration fee shown on the public form is read from Settings and is checked again by the backend at submission time.
- Public dates and content are refreshed from the Apps Script Web App when the homepage loads. If the settings endpoint is unavailable, the existing authored page text remains as a fallback.

## Notices publishing workflow

1. Sign in to `https://jkjcreations.org/admin.html`.
2. Create or edit the notice and choose **Published** to make it public. Draft notices remain private.
3. Save the notice and confirm the admin list shows the updated status.
4. Open `https://jkjcreations.org/notices.html` and the homepage in a fresh tab. Confirm the notice title, date, summary and full content appear.
5. If the notice does not appear, verify the deployed Apps Script version contains the current `doGet(e)`, `publicNotices_()` and `manageNotices_()` functions and that the Web App is deployed with public access.

## Privacy and security

- Keep the spreadsheet and Drive folders private. Do not publish their URLs.
- Admin actions require a server-side session; never place admin passwords or Script Properties in frontend code.
- Participant photos, original images and payment proofs should remain private and be opened only by authorised organisers.
- Verify payments against the actual bank/UPI account before approval.
- Define and publish an appropriate privacy, retention and contact policy before collecting real participant data.
- Do not share test registrations or real participant information in public notices.

## Pre-launch acceptance tests

Complete these tests on a test record before announcing the registration system as live:

- [ ] Health endpoint responds.
- [ ] Registration submission creates exactly one spreadsheet row.
- [ ] Duplicate name + WhatsApp submission is blocked without blocking different participants who share a family phone.
- [ ] Cropped photo, original photo and payment proof are stored in the intended private folders.
- [ ] Admin login works; invalid credentials are rejected.
- [ ] Admin dashboard counts match the spreadsheet.
- [ ] Payment cannot be approved without manual verification.
- [ ] Approval issues one unique Participant ID; rejection does not issue an ID.
- [ ] Entry Card preview, PNG download and WhatsApp sharing work on a phone and desktop.
- [ ] Entry Card displays only the Participant ID, not the internal tracking reference or a second card ID.
- [ ] Draft notices are hidden publicly; Published notices are visible.
- [ ] Published notices appear on both the public Notices page and homepage ticker.
- [ ] Admin-managed dates, fee, rules, prizes and contact details appear correctly on the homepage.
- [ ] Registration submission succeeds when all required fields, fee and uploads are valid.
- [ ] Notice edits and deletions are reflected after refresh.
- [ ] Password change invalidates the previous admin session.
- [ ] Public pages work at 320px, 375px, 430px, tablet widths, 1366px laptop and 1920px desktop.
- [ ] Test records are removed only after the complete flow is verified.

## Current verification boundary

GitHub Pages build status can be checked in the repository Actions tab. Google Apps Script deployment and the live Google account data must be checked by an authorised owner in Apps Script; a GitHub commit cannot prove those external services are correctly deployed or that a real bank payment has been received.
