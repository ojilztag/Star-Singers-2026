# STAR SINGERS 2026 — Project Master README

**Organiser:** JKJ CREATIONS  
**Event:** NAKSHATHRA GAYAKAR – STAR SINGERS 2026  
**Website:** https://jkjcreations.org/  
**Repository:** https://github.com/ojilztag/Star-Singers-2026  
**Primary branch:** `main`  
**Documentation reviewed:** 17 November 2026

> This document is the working project reference for future maintenance. It separates the features confirmed in the current repository from requirements discussed for a future version. A requirement described as planned below is **not** proof that it has already been implemented.

---

## 1. Project purpose

NAKSHATHRA GAYAKAR – STAR SINGERS 2026 is an online Christmas Carol Singing Competition presented by JKJ CREATIONS. The public website introduces the event, communicates its rules and information, and accepts individual participant registrations. The organiser uses a separate Admin Panel to review registrations, verify payments, approve or reject entries, and prepare participant Entry Cards.

The current website content identifies the event as an international online Christmas Carol Singing Competition and describes the USA First Edition.

## 2. Current system architecture

The project has two separately deployed parts:

1. **Frontend:** static website hosted through GitHub Pages / the connected website domain.
2. **Backend:** Google Apps Script Web App, backed by Google Sheets and private Google Drive folders.

GitHub Pages deployment does not publish Apps Script code. A backend code update requires a separate Apps Script save and Web App deployment.

### Main repository files

| File | Current role |
|---|---|
| `index.html` | Public event website, event information, registration form, participant photo crop interface and success flow |
| `admin.html` | Admin login, dashboard, registration review, payment verification, search/filter, export interface, Entry Card and WhatsApp hand-off |
| `Code.gs` | Google Apps Script API, registration persistence, admin authentication, Sheets/Drive access, manual payment verification, approval and ID generation |
| `backend-client.js` | Public registration form bridge; prepares and uploads participant photo(s) and payment proof to Apps Script |
| `site-config.js` | Reads public event settings from the Apps Script backend and updates website content |
| `responsive-polish.css` | Shared responsive and visual adjustments |
| `BACKEND_SETUP.md` | Backend installation, deployment and launch checklist |
| `assets/` | Event artwork, logos and other static media |

The homepage currently loads Cropper.js from a CDN, `site-config.js`, and `backend-client.js`. It also loads the shared responsive stylesheet. Keep external library versions and cache-busting query strings in mind when changing these files.

## 3. Current public registration form — repository evidence

The current form is a single form with the element ID `participantRegistration`. The current fields visible in `index.html` and the payload assembled by `backend-client.js` include:

- Participant Name
- Own Parish Name
- Own Diocese
- Current Country of Residence
- Current State / Province
- Current District / Region
- WhatsApp number with country calling code
- Cropped participant photo
- Original participant photo (falls back to the selected photo if no separate original is supplied)
- UTR / Transaction ID
- Payment proof
- Registration fee consent

The current backend requires the participant name, parish, diocese, country, state, district, WhatsApp number and UTR. It requires an uploaded participant photo and payment proof. The browser also validates the phone bridge and exactly 12 numeric UTR digits before submission.

**Important:** The current registration form/backend does not yet implement the planned Gender, Date of Birth, calculated Age, or automatic Junior / Senior / Super Senior category assignment. Those are future requirements in Section 10.

## 4. Current registration, payment and approval workflow

The current repository implements the following sequence:

1. A participant submits an individual registration with the configured fee consent and required details.
2. The browser prepares/compresses uploaded images where necessary and sends the registration payload to Apps Script.
3. Apps Script validates the payload and stores the registration row in the `Registrations` sheet.
4. Cropped photo, original photo and payment proof are saved in private Google Drive folders.
5. The initial statuses are:
   - Payment Status: `Pending Verification`
   - Registration Status: `Pending Review`
6. An authorised admin checks the actual bank / UPI credit and manually verifies the payment.
7. Only after payment is verified can the admin approve the registration.
8. Approval generates the next sequential Participant ID.
9. The Admin Panel can prepare an official Entry Card and open a pre-filled WhatsApp message. The admin downloads the Entry Card image, attaches it in WhatsApp and sends it.

A payment screenshot or entered UTR is **not** automatic payment verification. An organiser must independently confirm the actual credited transaction.

### Current registration fee and UTR rule

- Current configured registration fee: **₹300**.
- UTR / Transaction ID: exactly **12 numeric digits**.
- The backend checks the submitted fee against the fee stored in the Settings sheet.
- The current settings reader enforces ₹300 as the fee.

If a participant pays from another person's phone or UPI account, the exact UTR from that transaction must be entered so the organiser can reconcile the payment correctly.

### Current duplicate rule

The backend blocks a duplicate only when **both** of these match an existing registration:

- Participant Name (normalised for case and repeated whitespace)
- WhatsApp Number (normalised to digits)

A shared family WhatsApp number is therefore allowed for different participant names. Do not change this rule to phone-only duplicate blocking without an explicit product decision.

### Current statuses are separate

Payment status and registration status are separate fields. Payment verification is not the same as registration approval.

| Payment status | Registration status | Meaning |
|---|---|---|
| Pending Verification | Pending Review | Submitted; payment still needs manual checking |
| Verified | Pending Review | Payment confirmed; organiser decision still required |
| Verified | Approved | Approved participant; Participant ID generated |
| Rejected | Rejected | Registration/payment rejected |

The backend prevents approval until payment is manually verified.

## 5. Current Participant ID and record identification

The current backend generates IDs using:

- Prefix configured in `Code.gs`: `JKJ-CC26-M-`
- Example current format: `JKJ-CC26-M-001`
- IDs are assigned on approval, not at initial submission.
- The internal Tracking Ref is generated at submission and is used to locate the registration record and its private files.
- The Entry Card displays the official Participant ID. Internal Tracking Ref must not be printed as a second participant-facing identifier.
- A Script Property stores the high-water mark for the Participant ID sequence, and the backend also scans existing IDs before generating the next one.

**Do not assume that the current ID prefix or sequence can be changed or reset by editing the frontend.** The current sequence is backend-managed and a reset would require an explicit, carefully planned data migration. The proposed future format is documented separately below.

## 6. Current backend data model and storage

### Google Sheets

The current installer creates these tabs:

| Sheet | Current purpose |
|---|---|
| `Registrations` | Main participant and review records |
| `AuditLog` | Admin actions and registration activity |
| `Settings` | Event settings used by the website and registration fee check |
| `Payment Reconciliation` | Formula-based payment review view |
| `Dashboard` | Formula-based summary metrics |

The current registration headers include Tracking Ref, Participant ID, Submitted At, Participant Name, parish, diocese, residence country/state/district, WhatsApp Number, Entry Type, Registration Fee, UTR, photo and proof Drive IDs/URLs, Payment Status, Registration Status, Admin Note, Reviewed At and Reviewed By.

### Private Google Drive folders

The current setup creates a root folder named `STAR SINGERS 2026 — PRIVATE FILES`, with these child folders:

- `Cropped Participant Photos`
- `Original Participant Photos — Admin Only`
- `Payment Proofs — Admin Only`

The current backend limits uploaded file size to 3 MB and validates supported image / payment-proof MIME types. Keep these folders private. Do not publish their URLs or expose payment proofs and personal contact information in public reports.

### Script Properties and secrets

The backend relies on Script Properties for spreadsheet and Drive folder IDs, admin authentication data, session version and the Participant ID sequence high-water mark. These are external to the Git repository.

Never commit:
- Admin password or password hash/salt
- Session tokens
- Spreadsheet IDs or private Drive folder IDs
- Participant personal data, payment UTRs or proof files
- Any private deployment credentials

## 7. Current Admin Panel capabilities

The current `admin.html` and `Code.gs` include:

- Admin login and session-based authorisation
- Dashboard counts for total, pending payment, pending review, approved and rejected registrations
- Collection and pending amount summaries
- Latest seven-day submissions
- Search by Participant ID, Tracking Ref, name, WhatsApp number and other record text
- Registration status filters
- View participant photo through an authenticated backend request
- View payment proof and original photo links for authorised admins
- Manual payment verification
- Approve / reject actions
- Admin notes and activity log
- Change Admin password
- Entry Card preview and PNG download
- Pre-filled WhatsApp message hand-off
- Current participant export filters

The Admin API calls are queued by the browser client rather than intentionally dropped when another request is active.

## 8. Current export capability — do not confuse with the planned report centre

The current Admin Panel has a **Participant Records Export** section. It supports these backend filters:

- All registrations
- Approved participants
- Payment verification pending
- Payment verified / approval pending
- Rejected registrations

The backend returns participant record fields to the browser. The browser creates:
- Excel-compatible **CSV** download (not a native multi-sheet XLSX workbook)
- Browser print view that can be printed / saved as **PDF**

The current export includes submitted date, Participant ID, participant name, parish, diocese, country, state, district, WhatsApp, entry type, fee, UTR, payment status, registration status and admin note. Photo and payment-proof files are excluded.

**The six-category PDF/Excel export centre described in Section 11 is a proposed enhancement. It is not implemented by the current export code.**

## 9. Current site settings and deployment

The Admin Panel can manage public event information through the existing `Settings` sheet. Current setting fields include registration fee, registration open/close dates, video deadline, results date, participation information, rules summary, prize details, submission instructions, contact email and contact WhatsApp.

The website reads public settings through the Apps Script `siteconfig` endpoint. If settings cannot be fetched, authored homepage content remains the fallback.

### Apps Script API actions currently routed by `doPost`

- `register`
- `adminlogin`
- `admindashboard`
- `adminsearch`
- `getentryphoto`
- `exportregistrations`
- `verifypayment`
- `reviewregistration`
- `adminsettings`
- `changepassword`
- `adminlogout`

The `doGet` endpoint provides a health response and a public `siteconfig` response.

### Critical deployment rule

Updating `Code.gs` in GitHub does not update the Apps Script Web App. To deploy a backend change, update the existing Apps Script project and publish a new version through **Deploy → Manage deployments**. Do not create a second deployment or change the frontend API URL unless that is an intentional migration.

For one-time setup and deployment instructions, use [BACKEND_SETUP.md](BACKEND_SETUP.md).

**Never run `installStarSingers2026()` or `setupStarSingersBackend()` against an existing backend.** The installer is for a brand-new empty Apps Script project. Existing spreadsheet, Drive folders, Script Properties, admin account and deployment must be preserved.

## 10. Future registration structure — agreed direction, not yet implemented

The following requirements were discussed for the next version. They are the intended design direction, not a description of the current production code.

### One public registration page

Keep one single Registration Page and one registration form. Do not create six separate registration pages.

The participant supplies:
- Participant Full Name
- WhatsApp Number
- Email (whether optional or required still needs confirmation)
- Gender: Male / Female
- Date of Birth
- Participant photo (whether mandatory or optional still needs confirmation)
- Existing event-specific fields that remain required after final form review
- Payment details: ₹300 fee, 12-digit UTR and payment proof, subject to final organiser confirmation

### Automatic age and category assignment

The participant must not choose Junior, Senior or Super Senior manually.

1. Participant enters Date of Birth.
2. System calculates age against one official event **Age Cut-off Date**.
3. System assigns the age category automatically.
4. Browser may display the calculated age/category for clarity.
5. Backend must independently recalculate and validate the age/category. Never trust a category value supplied only by the browser.

Gender options:
- Male
- Female

Age category options:
- Junior
- Senior
- Super Senior

The six category combinations are:

1. Male Junior
2. Male Senior
3. Male Super Senior
4. Female Junior
5. Female Senior
6. Female Super Senior

### Age cut-off and age bands — decisions still required

The Age Cut-off Date is the common reference date used to calculate every participant's age. It is not automatically the registration closing date.

The exact cut-off date and exact category boundaries have **not** been confirmed in the reviewed source/code. Example bands previously discussed (5–17, 18–39, 40+) were examples only, not approved final rules.

Before implementation, the organiser must confirm:
- Official Age Cut-off Date
- Junior minimum and maximum age
- Senior minimum and maximum age
- Super Senior minimum age and whether a maximum applies
- Whether boundary ages are inclusive

The configuration must avoid gaps and overlaps. The backend must reject invalid DOBs and any participant outside all configured bands. Category limits should be centrally configurable for Admin use, not duplicated as hard-coded browser-only rules.

### Individual identity and Participant ID

Every person must have one distinct participant record and one unique official Participant ID. Different people may share a family WhatsApp number, consistent with the current duplicate rule.

The agreed design direction is:
- One common sequential ID series across all six category combinations.
- No separate ID sequence for each gender or age category.
- Proposed example format: `SS2026-001`, `SS2026-002`, `SS2026-003`.
- One participant gets one ID; the ID must not change when their category display or report filter changes.
- Admin should be able to find an individual using Participant ID, name or WhatsApp number.
- Use a server-side lock / atomic sequence allocation to prevent two simultaneous approvals receiving the same ID.
- Decide whether the official ID is generated at submission or only after approval. The current system issues it only after approval; that is the safer continuity default unless the organiser explicitly changes it.
- A request to restart numbering from 001 is not an instruction to delete or reset production records. Before any reset, inspect the real spreadsheet, existing IDs and Script Properties and obtain explicit approval for the exact reset scope.

The proposed `SS2026-` format conflicts with the current `JKJ-CC26-M-` prefix. A migration plan is required before implementation; do not mix formats accidentally.

### Duplicate and shared contact handling

Keep the current rule unless the organiser explicitly changes it: block only a duplicate Participant Name + WhatsApp Number pair. A parent/guardian/family number may be used by different participants. Consider normalising participant names and international phone numbers consistently on both client and server.

## 11. Future Admin Panel and reporting requirements — planned

Keep one Admin Panel as the central control centre. It should manage all six category combinations, not six separate admin systems.

### Admin list, filters and person-level identity

Planned controls:
- Search by Participant ID, participant name, WhatsApp number and Tracking Ref
- Gender filter
- Age Category filter
- Payment Status filter
- Registration Status filter
- View one participant's complete record and uploaded documents
- Verify payment independently from approval
- Approve / reject with admin note
- Correct a category only through a permission-controlled action, with an audit entry explaining who changed it and why
- View / download / share the official Entry Card after approval

Each category report must list individual participant rows. A category is a grouping/report filter; it is not a shared identity. Each participant remains a separate record with one unique Participant ID.

### Export Centre — planned 10 selections × 2 formats

The planned Export Centre contains ten report selections:

**Six individual category reports**
1. Male Junior
2. Male Senior
3. Male Super Senior
4. Female Junior
5. Female Senior
6. Female Super Senior

**Three aggregate selections**
7. Male — all age categories
8. Female — all age categories
9. All Participants — Master

This is nine selections in the list above. If a tenth selection is desired, it must be specified by the organiser; do not silently invent another report type.

Each available selection should support:
- PDF
- Excel workbook

### Planned Master Excel workbook

The intended Master Excel workbook has eight worksheets:

1. All Participants
2. Male Junior
3. Male Senior
4. Male Super Senior
5. Female Junior
6. Female Senior
7. Female Super Senior
8. Category Summary

### Planned PDF reports

A category PDF should include:
- Event / organiser branded heading
- Category title
- Total participant count
- Approved / pending / rejected counts
- Participant list with appropriate columns
- Generated date and page numbering

The Master PDF should group all six categories, include category summaries and participant lists.

Two privacy levels were discussed:
- **Official Participant List:** Participant ID, Name, Age, Category and Approval Status.
- **Admin Detailed Report:** additional private fields such as DOB, WhatsApp, UTR and payment / registration statuses.

Public/shareable participant lists must not expose WhatsApp numbers, full DOBs, UTRs, payment proofs or other unnecessary personal data. Admin Detailed Reports must require admin authentication and be stored/shared securely.

### Excel data handling

The planned workbook should use separate category worksheets, filters, sorting and sensible column widths. WhatsApp numbers and UTRs should be written as text to preserve leading zeros and formatting. Include only the fields needed for the selected privacy level.

Temporary export files in Drive must not become public by default. Define access permissions and cleanup/retention before implementation.

## 12. Suggested future backend responsibilities

These are design suggestions only; the functions are not confirmed as existing code:

- Age calculation against the official cut-off date
- Category assignment from Gender + calculated age
- Server-side age-band validation
- Unique Participant ID allocation with locking
- Category-specific and aggregate record filtering
- Category counts and summary generation
- PDF / XLSX workbook generation
- Audit logging for category corrections and export actions
- Secure temporary file creation and cleanup

Before adding new Sheets or columns, inspect the actual current spreadsheet schema and existing Script Properties. Reuse existing structures where safe. Do not create duplicate registration databases or run the installer again.

## 13. Data and migration safety

The organiser has described current entries as demo data and has discussed a possible clean restart. This README does not authorise deletion.

Before deleting demo records or resetting IDs:
1. Confirm the exact spreadsheet and the exact rows to remove.
2. Back up the spreadsheet and relevant Drive files.
3. Confirm whether payment proof, photos, audit logs and rejected records are also in scope.
4. Confirm whether the ID sequence Script Property should be reset.
5. Preserve Admin Login, password hash/salt, session configuration, spreadsheet ID, Drive folder IDs and the current Apps Script deployment unless explicitly authorised otherwise.
6. Do not run the one-time installer as a reset tool.
7. Record the approved reset and verify the next ID in a controlled test.

## 14. Known limitations and verification boundaries

- The current code does not implement Gender/DOB age categories.
- The current code does not implement six category-specific lists or the planned Master workbook.
- The current export is CSV plus browser print-to-PDF, not native XLSX/PDF generation on the server.
- Current Participant ID prefix is `JKJ-CC26-M-`, not the proposed `SS2026-`.
- The current website has a single registration form, but its current field set is not yet the planned Gender/DOB form.
- WhatsApp is a manual hand-off: the Admin Panel opens a pre-filled message and the admin attaches/sends the Entry Card. This does not establish an automated WhatsApp API integration.
- GitHub source inspection cannot prove the live Apps Script deployment is current, the connected spreadsheet is correct, Drive permissions are safe, or a real payment was credited.
- Complete the acceptance tests in [BACKEND_SETUP.md](BACKEND_SETUP.md) after any implementation or deployment.

## 15. Relevant Git history reviewed

The recent `main` branch history was reviewed on 17 November 2026. Relevant commits include:

| Commit | Recorded change |
|---|---|
| `e2a2562f76fd22787c6f5bdd95f33cc6c943462b` | Back-to-top button made smaller and less prominent |
| `7b389cc6225ccd62b9a6880a13f3ce492ac1c04` | Clarified duplicate rejection and WhatsApp delivery after admin verification |
| `a40da1977f4da057fc4a45f18a5ce8524625f136` | Expanded entry category details with fee and registration rules |
| `33b7afefaf7bf99a072d90767934496b78b6373c` | Expanded Entry Category into three bilingual information cards |
| `0ee693f776586761214cb6b33fafa37df2be3fe2` | Added bilingual registration error and upload guidance |
| `3b9e06078f96087fc75c118269786903ff053c3c` | Added bilingual participant benefits and future opportunities section |
| `68cd75e001be337558e555fbca2a6321570e4c16` | Added a standalone Apps Script backend copy without Notices |
| `fa073e422b11a33655507b09d3dcccfcd5345303` | Removed the unwanted Notices feature while retaining registration and payment workflow |

Earlier commits in the reviewed history show that a Notices feature was introduced, repaired and documented, then removed at the organiser's request. The current project direction is to keep Notices removed unless explicitly requested again.

The commit history is useful for understanding why features or UI sections changed. Before reverting or replacing a file, inspect the relevant commit diff and current file state; do not assume an older commit is a safe drop-in replacement.

## 16. Recommended maintenance workflow for future updates

For every future request:

1. Identify whether the request concerns the public website, Admin Panel, Apps Script backend, Google Sheets/Drive data, deployment, or documentation.
2. Fetch the latest `main` branch files before editing. Do not work from an old local copy or remembered snippet.
3. Check the current commit history and relevant diffs for the files being changed.
4. Identify all frontend/backend payload fields and API actions affected by the change.
5. Preserve existing data structures and deployment configuration unless a migration is explicitly approved.
6. Implement the smallest safe change. Do not modify unrelated design, content or backend behaviour.
7. Review the diff and check for syntax errors, missing DOM IDs, mismatched request fields, changed API names and mobile layout regressions.
8. For backend changes, update and deploy the existing Apps Script project separately from GitHub.
9. Run the relevant acceptance tests with controlled demo records.
10. Record the resulting commit SHA, files changed, tests performed and any manual deployment steps.

### Non-negotiable safeguards

- Never run the one-time installer on an existing backend.
- Never delete records or reset IDs without explicit confirmation and a backup.
- Never expose participant private information in public pages or reports.
- Never treat a submitted screenshot/UTR as verified payment.
- Never issue approval before payment verification.
- Never claim a WhatsApp message was sent automatically when the current flow only opens WhatsApp for the admin.
- Never claim an Apps Script deployment was updated just because GitHub was committed.

---

## 17. Quick reference for the next development session

**Current live implementation:** one public registration form; current parish/diocese/residence fields; photo and payment-proof upload; ₹300 fee; 12-digit UTR; private Sheets/Drive storage; admin login; manual payment verification; separate approval; sequential `JKJ-CC26-M-` Participant ID; Entry Card PNG; manual WhatsApp hand-off; CSV and print-to-PDF exports.

**Next agreed product direction:** keep one registration page and one Admin Panel; add Gender + DOB; calculate age using one confirmed cut-off date; assign one of six gender/age categories automatically on the server; maintain one common unique Participant ID sequence; provide individual category reports and aggregate Master reports with privacy-safe public/admin variants.

**Still awaiting organiser confirmation:** official age cut-off date; exact inclusive age boundaries for Junior/Senior/Super Senior; email requirement; participant photo requirement; final decision on ID prefix/migration and when the official ID is issued; the missing tenth export selection if ten are still desired.

**No implementation of the future category system or report centre should begin until these open rules are confirmed and the actual existing spreadsheet/backend schema has been inspected.**
