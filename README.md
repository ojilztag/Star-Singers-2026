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


---

## 18. Star Singers 2026 — Coordinator Profile Card (standard frame locked)

**Status:** The coordinator profile-card frame shown on the website is the approved reusable master design. Use the same frame and visual system for every future coordinator profile. Do not create a different card style for each person.

### Locked frame and visual style

- Use the same wide, horizontal profile-card layout: portrait on the left and coordinator details on the right.
- Preserve the rounded outer card, fine gold border, internal dividers, dark navy / deep teal background and gold accents.
- Keep the portrait in the left-hand photo area, with the same crop treatment and frame styling. Do not change the approved portrait dimensions when adding another coordinator.
- Keep the same card width, proportions, padding, border radius and responsive behaviour across all coordinator cards.
- On mobile, keep the same side-by-side portrait-and-details header where it fits; scale and wrap text without clipping or changing the card concept.
- Use the same typography hierarchy, spacing, badge treatment, WhatsApp contact-row style and responsibility-row styling for every person.

### Standard content order for every coordinator

1. **Portrait:** coordinator photo on the left, using the same photo frame and crop treatment.
2. **Official badge:** OFFICIAL COORDINATOR at the top of the information area.
3. **Organisation identity:** JKJ CREATIONS text and the JKJ CREATIONS logo, using the same alignment and scale.
4. **WhatsApp contact number:** show a small WhatsApp icon immediately beside the phone number. The icon belongs beside the number, not beside the person's name.
5. **Designation:** display the coordinator's role below the phone number.
6. **Contact action row:** show the person's name in large, bold text with the WhatsApp contact action and the CHAT label. Keep the same button layout for every profile.
7. **Assigned programme / responsibilities:** use matching bordered information rows with the same icon placement, heading style and body text treatment.

### Content and asset rules

- Only use the actual person's supplied name, role, phone number, photograph and approved responsibility details.
- Use the official JKJ CREATIONS logo asset consistently; do not substitute a different logo or create a different logo treatment for each profile.
- Keep each person's WhatsApp link connected to that person's own verified number. Never copy another coordinator's number or chat URL.
- Do not invent profile details. If information or a photograph has not been supplied, leave that content unfilled until it is provided; do not publish sample personal data.
- Keep all content inside the existing card frame. Do not allow text, icons, images or buttons to overlap or overflow.

### Reusable template rule

For every new coordinator, duplicate the approved coordinator-card structure and replace only the person-specific content and assets. Keep the frame, layout, colour palette, logo treatment, typography hierarchy, contact-row design, responsibility-row design and mobile behaviour identical. Any change to the shared frame must be treated as a global design change and applied consistently to all coordinator cards.

### Implementation reference

- Main file: index.html
- Current reference baseline: commit 06dc382 (the version restored at the organiser's request on 18 November 2026).
- Before adding or editing coordinator cards, fetch the latest index.html and this README. Preserve the standard frame above and make only the requested content changes.
- After a shared frame change, check desktop and mobile layouts and verify every coordinator's photo, number and WhatsApp link independently.

**Maintenance instruction:** This section is the authoritative design reference for all current and future coordinator profile cards. One approved frame, reused consistently for everyone.

---

## 19. Permanent documentation, change log and backup policy

This section defines the required documentation procedure for every future project update. It is a maintenance requirement, not an assertion that a backup has automatically been made for every historical change.

### Documentation is part of every change

Whenever a website, Admin Panel, backend, configuration, asset, workflow or deployment change is made:

1. Fetch the latest README.md and the latest affected source files from the main branch before editing.
2. Read the relevant existing documentation and inspect the current implementation. Do not rely only on old chat messages, screenshots, memory or an earlier local copy.
3. Implement and verify the requested change with the smallest safe scope.
4. Update this README in the same work session, recording the new current state and any changed instructions.
5. Add a dated entry to the Change Log below, including the exact files changed, behaviour changed, behaviour deliberately preserved, verification performed and any manual deployment still required.
6. Create or refresh README.md.backup from the exact final contents of README.md after the README update has been committed.
7. Report both commit links and clearly state whether the live website/backend was actually verified.

If the change is documentation-only, record that fact. If no source code was changed, do not imply that application behaviour changed.

### What every update record must capture

For each meaningful change, document:
- Date (UTC where available) and short change title.
- Request / reason for the change.
- Files and components affected.
- Previous behaviour and new behaviour.
- Desktop appearance and behaviour, where relevant.
- Mobile appearance and behaviour, where relevant.
- Approved layout details preserved: dimensions, alignment, spacing, typography, colours, image crop, borders, responsive breakpoints and interaction behaviour, as applicable.
- Related frontend/backend API fields, actions, data columns or settings, where applicable.
- Data migration or configuration impact.
- Tests and checks actually performed, including devices/viewports if known.
- Known limitations, unresolved issues and follow-up work.
- Git commit SHA and link.
- Separate hosting or Apps Script deployment status.

Never write tested, fixed, deployed or live unless the corresponding action was actually performed and verified. Distinguish source-code review from browser testing and live deployment verification.

### Design and behaviour preservation record

The current approved coordinator profile-card design is specified in Section 18. That specification is a locked reference unless the organiser explicitly requests a global design change.

For all other website sections, do not invent measurements or claim that a layout is locked unless it has been inspected in the current source or explicitly approved by the organiser. When a section is changed:
- Capture the current desktop and mobile appearance before editing when visual regression risk exists.
- Record the actual CSS selectors, dimensions, spacing and responsive rules that matter to the change.
- Preserve unrelated page alignment, navigation, slide behaviour, scroll behaviour, buttons, links and existing content.
- Compare the changed section with the pre-change version.
- Check neighbouring sections for overflow, overlap, unexpected shifts and mobile scroll regressions.
- If an approved earlier version is the reference, record its exact Git commit SHA and file path. Do not use a vague label such as old design.
- If the exact reference cannot be inspected, say so and ask for the required reference instead of guessing.

### Backup file rules

- README.md is the current master documentation.
- README.md.backup is a point-in-time copy of the master README.
- After every README update, refresh README.md.backup so its contents exactly match the committed README.md.
- Use Git history as the version history; do not overwrite or delete historical commits.
- A backup README is documentation only. It is not a backup of source code, Google Sheets, Drive uploads, Apps Script properties, secrets or deployments.
- Do not store passwords, tokens, private IDs, participant personal data, UTRs or payment proofs in either README file.
- If the backup update fails, state that clearly. Do not claim that both files are backed up.
- For a full project backup, separately identify and back up the repository source/assets and the external Apps Script, Sheets and Drive data using their appropriate secure procedures.

### Restore procedure

To restore an earlier README:
1. Identify the exact commit or backup version to restore.
2. Inspect its contents and confirm that it is the intended version.
3. Fetch the current README.md and its current blob SHA.
4. Update README.md with the selected content and a clear restore commit message.
5. Refresh README.md.backup from the restored README.md.
6. Record the restore commit and source version in the Change Log.

To restore application code or design:
1. Identify the exact file and known-good commit.
2. Inspect the relevant diff and dependencies before restoring.
3. Fetch the latest target file and SHA.
4. Restore only the intended file(s) or change(s), unless a full rollback is explicitly approved.
5. Preserve unrelated fixes made after the reference commit.
6. Test the affected desktop/mobile views and connected functionality.
7. Update this README and backup after the restore.
8. Verify the relevant hosting or Apps Script deployment separately.

Never restore an entire old project snapshot just because one component needs reverting. Prefer a narrow, reviewed restore.

### Change Log

Add newest entries at the top. Keep older entries; do not silently replace or erase history.

| Date (UTC) | Change | Files | Verification / deployment |
|---|---|---|---|
| 2026-11-19 | Connected Biji P. John profile photo slot to the exact asset path `assets/biji-p-john-coordinator.jpg`; retained the existing coordinator card frame and layout. The image file itself is to be uploaded by the organiser. | index.html | Source updated; image display awaits upload of the exact-named asset; live browser rendering not verified |
| 2026-11-18 | Added permanent documentation, visual-regression, change-log and backup/restore policy; refreshed README backup | README.md, README.md.backup | GitHub commits recorded; live website not changed by this documentation update |

### Required close-out checklist

Before closing any future implementation task, confirm:
- [ ] Latest source files were fetched before editing.
- [ ] Requested scope was implemented without unrelated changes.
- [ ] Desktop layout checked where the change affects desktop.
- [ ] Mobile layout and touch/scroll behaviour checked where relevant.
- [ ] Existing links, buttons, forms and navigation checked where affected.
- [ ] Frontend/backend contract and data safety reviewed where relevant.
- [ ] README current-state documentation updated.
- [ ] Change Log entry added with exact files and commit reference.
- [ ] README.md.backup refreshed from the final README.
- [ ] GitHub commit links recorded.
- [ ] Hosting / Apps Script deployment status stated accurately.
- [ ] Any unverified behaviour or pending manual action disclosed.

Standing instruction: Treat this README as the project handover document. A future developer or assistant should be able to understand the verified current implementation, approved design constraints, known gaps, previous changes and safe next steps without assuming that planned features are already live.

## 20. Biji P. John — photo asset path

The Biji P. John coordinator profile image element uses this exact repository asset path:

`assets/biji-p-john-coordinator.jpg`

Upload the image into the repository's `assets/` folder with that exact filename (same spelling, hyphens and `.jpg` extension). The existing coordinator profile-card frame, dimensions, alignment, spacing and visual treatment are not to be changed when this asset is added. This source reference does not mean the image file has already been uploaded; until the exact asset exists on the deployed branch, the browser may show a missing image.


### Biji P. John square photo display
- The Biji P. John coordinator photo uses a dedicated square frame (`.coordinator-photo-frame`).
- The complete source image is displayed with `object-fit: contain`; the frame is square at desktop and mobile sizes, avoiding the unused blank area below the photo.
- This is a photo-frame-only adjustment. Coordinator card structure, identity content, and the surrounding profile design remain unchanged.


### Site-wide square photo standard
- All uploaded person, coordinator, sponsor, supporter and sponsor-gallery photos use square (1:1) display frames.
- Source images are shown fully inside their frames with `object-fit: contain`; they are not stretched or cropped.
- Participant registration photo selection is also prepared as a square image.
- This rule applies to future photos added to the existing supported photo-frame classes. Preserve each card's surrounding layout and content unless the organiser explicitly requests a design change.


### Square photo frame fit refinement
- Square uploaded photos fill their square frames edge-to-edge using `object-fit: cover` and centered positioning.
- This avoids empty/black letterbox areas inside the frame while retaining the square frame shape. Square source photos are expected; non-square photos may be cropped to fill.
- Apply the same display rule to coordinator, digital profile, sponsor and supporter photo frames.


### Coordinator header background cleanup
- Removed the tinted gradient background from `.coordinator-profile-header` so the photo area blends cleanly with the coordinator card background.
- The coordinator card structure, photo border/frame, text and spacing remain unchanged.


### Mobile coordinator photo background fix
- On mobile widths (up to 760px), `.coordinator-profile-header` explicitly uses a transparent background and disables background images so no tinted gradient appears behind the photo.
- Desktop styling is not changed by this mobile-only override.


### Mobile coordinator photo-frame interior cleanup
- On mobile only, the coordinator photo image element has no background color or background image, preventing card tint from showing through any unpainted part of the photo frame.
- No card layout, frame border, dimensions, spacing, image source, or desktop styling is changed by this targeted rule.


### Mobile coordinator gold frame inset adjustment
- On mobile only, the coordinator photo's gold frame is slightly reduced and inset by 4px to keep its edge neatly within the photo column.
- The frame remains square; the source image, border color, card layout, and desktop dimensions are unchanged.


### Permanent photo-frame standard (single source of truth)
- Coordinator portraits, digital profile photos, sponsor photos and sponsor-gallery photos use square 1:1 frames.
- Uploaded square images fill the frame edge-to-edge with centered `object-fit: cover`; no background-colored inner gutters or letterbox gaps are allowed.
- Coordinator photo frames retain the existing gold border and use one consistent mobile/desktop sizing rule. The Biji wrapper and direct coordinator image use the same frame dimensions.
- Sponsor placeholders retain their existing card dimensions while enforcing a square ratio; uploaded images fill those placeholders.
- Future changes must edit this canonical rule rather than append competing photo-size overrides. Preserve card layout, text, colors and unrelated page content.
- Participant photo upload already uses a square crop ratio; keep that behavior aligned with this display standard.

## Canonical square photo-frame standard
- The single authoritative photo-frame stylesheet is `#jkj-canonical-photo-frame-standard` in `index.html`.
- Coordinator portraits, digital coordinator/team portraits, prize-sponsor photos and sponsor-directory photos use 1:1 square frames.
- Uploaded photos fill the frame edge-to-edge with `object-fit: cover`, centered; image dimensions are equal width and height at desktop, mobile and narrow mobile breakpoints.
- Sponsor and coordinator frame sizes may differ by component, but every frame remains square. Existing card structure, typography, content, and unrelated page styling must not be changed for photo updates.
- Before every future update, fetch the latest `main` source and its SHA; make only the requested scoped change; preserve the canonical photo-frame standard; update this README and `README.md.backup`; verify the committed source and assets.
- Do not add competing/duplicate photo CSS rules. Extend the canonical stylesheet only when a genuinely new photo-frame class is introduced.


## 21. Website-wide responsive and integrity audit — 2026-11-19

### Audit scope and verified findings

- Reviewed the current `index.html`, `admin.html`, `responsive-polish.css`, `site-config.js`, `backend-client.js`, `Code.gs`, existing quality workflow and repository asset tree.
- Confirmed the mobile page uses a deliberate section-by-section slideshow at narrow widths, while desktop uses the full-page layout. This behaviour is preserved; it is not silently removed as part of responsive cleanup.
- Found that the square photo-frame stylesheet was not the last stylesheet in the document cascade: the coordinator component stylesheet appeared after it. Moved the canonical photo-frame stylesheet after the component stylesheet so its square dimensions and image-fit rules are authoritative.
- Removed the coordinator component stylesheet's duplicate portrait width/height declarations. The approved portrait card, header grid, text, border styling and component layout remain otherwise unchanged.
- The canonical photo standard now governs coordinator portrait frames, the Biji wrapper and its inner image, digital/team portraits, prize-sponsor photo placeholders and sponsor-directory photo placeholders. Frames remain 1:1 at desktop, mobile and narrow-mobile breakpoints; images use centered `object-fit: cover`.
- Confirmed both public pages have unique HTML IDs, local referenced files resolve in the repository, existing image elements have alt text, the viewport meta tag is present, and the README backup matches the master at the time of this audit.
- Confirmed the current GitHub Actions JavaScript syntax check passes. Added a separate static site-integrity check to CI for page structure, local assets, CSS brace balance, image alt text, viewport metadata, canonical photo-frame rules and README backup parity.

### Ongoing maintenance rules

1. Fetch the latest `main` source and blob SHA before every edit.
2. Make the smallest scoped change; do not append another conflicting CSS override.
3. Keep `#jkj-canonical-photo-frame-standard` as the final inline stylesheet and the single source of truth for photo-frame dimensions and image fit.
4. Preserve the current desktop layout and the intentional mobile section-navigation experience unless the organiser explicitly requests a change.
5. After each change, run both GitHub Actions checks, inspect the latest Pages deployment result, update this README and refresh `README.md.backup`.
6. Never report a live visual check unless a real browser/device test was performed.

### Verification boundary

This is a repository/source and CI audit. GitHub Actions can verify syntax, static page integrity and the Pages build/deployment job; it cannot prove the final appearance on every Android Chrome, iOS Safari or desktop browser. The live website must still be visually checked at representative viewport sizes. The Google Apps Script backend, live payment verification, email/WhatsApp delivery and real registration transactions were not changed by this frontend audit and require separate controlled end-to-end tests before they can be marked verified.

### Audit change log

| Date (UTC) | Change | Files | Verification / deployment |
|---|---|---|---|
| 2026-11-19 | Moved canonical square photo-frame rules after all component styles; removed duplicate coordinator portrait dimensions; added static site-integrity checks to GitHub Actions. Preserved existing card design and mobile section navigation. | index.html, scripts/check-site.py, .github/workflows/quality.yml, README.md, README.md.backup | JavaScript syntax and static site-integrity checks passed on commit c8f8260; Pages deployment result pending at time of documentation. Browser/device visual testing and backend end-to-end testing remain pending. |



### Coordinator portrait size restoration and inner-image fill — 2026-11-19
- Historical comparison confirmed the original coordinator portrait used a 154 × 166 px desktop frame and a 124 × 142 px mobile frame.
- The square-frame consolidation had reduced the mobile coordinator frame to 124 × 124 px. Restore a larger square mobile frame: 142 × 142 px for 351–650 px viewports, and 124 × 124 px for narrow screens at or below 350 px. Desktop remains 154 × 154 px.
- The coordinator header grid column is matched to the frame at each mobile breakpoint so the photo does not overflow or get clipped by its own column.
- Explicitly size the inner `.coordinator-profile-photo > img` to 100% width and height with centered `object-fit: cover`, zero padding/margins and no inner border. This ensures the uploaded square image fills the gold frame edge-to-edge.
- No card structure, identity text, colours, navigation, sponsor sizes or unrelated layout changed.


## 21. Mobile coordinator portrait proportion
- Coordinator profile cards use a 124 × 124 px square photo frame on mobile screens up to 650 px wide; very narrow screens use 108 × 108 px.
- Coordinator names stay on one line within the existing identity column, with a responsive font size to prevent the name extending beyond the card.
- Desktop coordinator photo sizing remains unchanged. Sponsor, participant, and other photo frame rules are not changed by this coordinator-specific adjustment.
- Preserve the established card layout, borders, gold frame, and image fill behaviour.


## 22. Compact mobile slide navigation
- Keep the mobile slideshow pager compact and close to the bottom safe area so it does not unnecessarily cover the active section.
- Preserve previous/next controls, the current slide count, and the full set of navigation dots; allow dots to compress slightly on narrow phones rather than overflow or disappear.
- Keep desktop navigation unchanged. This is a mobile pager-only adjustment and must not alter section, category, coordinator, sponsor, or participant card layouts.
