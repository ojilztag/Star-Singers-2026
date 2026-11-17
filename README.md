# STAR SINGERS 2026 — Website & Registration Backend

Website: https://jkjcreations.org  
Repository: https://github.com/ojilztag/Star-Singers-2026

NAKSHATHRA GAYAKAR – STAR SINGERS 2026 is an online Christmas Carol Singing Competition presented by JKJ CREATIONS.

## Main components
- `index.html` — public event website, responsive navigation, event information, registration form and photo crop editor.
- `responsive-polish.css` — shared mobile, tablet, laptop and desktop layout adjustments.
- `backend-client.js` — registration bridge to Google Apps Script.
- `admin.html` — secure admin dashboard, registration review, payment verification, Entry Card preview/download/share and notice management.
- `Code.gs` — Google Apps Script API, Sheets database, private Drive uploads, admin authentication, manual payment review, Participant ID generation and notices.
- `notices-data.js` + `notices.html` — public feed for Published notices only.
- `assets/` — event artwork and JKJ CREATIONS branding.

## Registration workflow
1. Participant submits one individual entry and the configured ₹300 fee consent.
2. Participant selects and crops a square photo.
3. Browser submits cropped and original photos, an exactly 12-digit UTR and payment proof to Apps Script.
4. Apps Script stores the registration and files in private Google Drive folders.
5. Admin checks actual bank/UPI credit and verifies payment.
6. Admin approves or rejects the application.
7. Only an approved participant receives a sequential Participant ID.

The UTR / Transaction ID must be exactly 12 numeric digits. If payment is made from another person’s phone or UPI account, the payer’s exact transaction UTR must be entered so organisers can identify the paying account and avoid mixing up payment records.

**Payment screenshots and UTR numbers are not automatic payment verification.** Organisers must confirm the actual credit independently.

## Entry Card
The official Entry Card uses the participant's approved photo and official Participant ID. Internal tracking references are not participant-facing IDs and must not be printed as a second identifier.

## Notices
Admin-created notices are stored in the Google Sheets `Notices` tab. Only `Published` notices are returned to the public website. Draft and Archived notices are not public.

## Deployment
GitHub Pages hosts the frontend. Google Apps Script is a separate backend deployment. Updating GitHub does not automatically publish new Apps Script code. Follow [BACKEND_SETUP.md](BACKEND_SETUP.md) for one-time setup, Apps Script redeployment and acceptance tests.

## Device support
The shared responsive stylesheet targets mobile phones, tablets, laptops and desktop browsers. Complete the viewport acceptance tests in `BACKEND_SETUP.md` before declaring the site production-ready.
