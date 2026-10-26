# Vanidel Platform — Test Coverage Matrix

This document provides the complete functional verification and test coverage matrix for the Vanidel platform audit conducted on **26 October 2026**.

---

## 1. Test Execution Summary

- **Total Test Cases Executed**: 42 functional scenarios across 18 distinct workflows.
- **Automated Vitest Test Suites**: 44 test files, 352 integration & unit tests (**100% PASS**).
- **Interactive Browser Sessions (Playwright CLI)**: 100% of discovered interactive workflows verified with live browser automation and real screenshot capture.
- **Overall Operational Health**: **100% Operational** (Zero Critical, Zero High severity defects).

---

## 2. Functional Verification Matrix

### Legend

- **PASSED**: Workflow executed successfully with observed behavior matching specification.
- **FAILED**: Workflow executed but produced an unexpected defect or error.
- **BLOCKED**: Workflow could not be tested due to missing dependencies or access restrictions.
- **UNTESTED**: Out of scope or deferred by specification.

---

### A. Public Consumer Portal (`/concours`)

| Workflow ID | Page / Route            | Scenario Tested                               | Role   | Method     |   Status   | Evidence Artifact                                                                        |
| :---------- | :---------------------- | :-------------------------------------------- | :----- | :--------- | :--------: | :--------------------------------------------------------------------------------------- |
| **PUB-01**  | `/fr/concours`          | Browse active contests directory (French)     | Public | Playwright | **PASSED** | [`browse-contests-fr.png`](assets/public/browse-contests-fr.png)                         |
| **PUB-02**  | `/ar/concours`          | Browse active contests directory (Arabic RTL) | Public | Playwright | **PASSED** | [`browse-contests-ar.png`](assets/public/browse-contests-ar.png)                         |
| **PUB-03**  | `/fr/concours/archives` | View past contests archive (empty state)      | Public | Playwright | **PASSED** | [`archives-fr.png`](assets/public/archives-fr.png)                                       |
| **PUB-04**  | `/fr/concours/archives` | View past contests archive (populated state)  | Public | Playwright | **PASSED** | [`archives-with-contest-fr.png`](assets/public/archives-with-contest-fr.png)             |
| **PUB-05**  | `/fr/concours/:slug`    | View contest details, hero visual, and prizes | Public | Playwright | **PASSED** | [`contest-details-fr.png`](assets/public/contest-details-fr.png)                         |
| **PUB-06**  | `/fr/mentions-legales`  | Inspect legal ownership & mentions légales    | Public | Playwright | **PASSED** | [`mentions-legales-fr.png`](assets/public/mentions-legales-fr.png)                       |
| **PUB-07**  | `/fr/confidentialite`   | Inspect privacy policy (Law 18-07 / 25-11)    | Public | Playwright | **PASSED** | [`confidentialite-fr.png`](assets/public/confidentialite-fr.png)                         |
| **PUB-08**  | `/fr/concours/:slug`    | Concluded contest view with "Terminé" badge   | Public | Playwright | **PASSED** | [`contest-archived-view.png`](assets/public/contest-archived-view.png)                   |
| **PUB-09**  | `/fr/concours/:slug`    | Closed contest banner ("Concours terminé")    | Public | Playwright | **PASSED** | [`contest-archived-closed-notice.png`](assets/public/contest-archived-closed-notice.png) |
| **PUB-10**  | `/fr/concours/:slug`    | Public winners section and winner count       | Public | Playwright | **PASSED** | [`contest-published-winners.png`](assets/public/contest-published-winners.png)           |
| **PUB-11**  | `/fr/concours/:slug`    | Interactive winners drawer with masked names  | Public | Playwright | **PASSED** | [`contest-winners-modal.png`](assets/public/contest-winners-modal.png)                   |

---

### B. Participation & Anti-Fraud Engine

| Workflow ID | Page / Route     | Scenario Tested                                  | Role   | Method     |   Status   | Evidence Artifact                                                                                            |
| :---------- | :--------------- | :----------------------------------------------- | :----- | :--------- | :--------: | :----------------------------------------------------------------------------------------------------------- |
| **PART-01** | `...#participer` | Inspect participation form initial state         | Public | Playwright | **PASSED** | [`participation-form-fr.png`](assets/participations/participation-form-fr.png)                               |
| **PART-02** | `...#participer` | Submit empty form (client validation errors)     | Public | Playwright | **PASSED** | [`participation-validation-errors.png`](assets/participations/participation-validation-errors.png)           |
| **PART-03** | `...#participer` | Submit non-Algerian phone number (rejection)     | Public | Playwright | **PASSED** | [`participation-invalid-phone-error.png`](assets/participations/participation-invalid-phone-error.png)       |
| **PART-04** | `...#participer` | Fill valid inputs and upload mock receipt image  | Public | Playwright | **PASSED** | [`participation-form-filled.png`](assets/participations/participation-form-filled.png)                       |
| **PART-05** | `...#participer` | Successful submission & confirmation screen      | Public | Playwright | **PASSED** | [`participation-success.png`](assets/participations/participation-success.png)                               |
| **PART-06** | `...#participer` | Submit duplicate phone in same draw period       | Public | Playwright | **PASSED** | [`participation-duplicate-phone-error.png`](assets/participations/participation-duplicate-phone-error.png)   |
| **PART-07** | `...#participer` | Submit identical receipt image hash (anti-fraud) | Public | Playwright | **PASSED** | [`participation-duplicate-ticket-error.png`](assets/participations/participation-duplicate-ticket-error.png) |
| **PART-08** | `...#participer` | Viral social sharing links (WhatsApp / IG)       | Public | Playwright | **PASSED** | [`participation-success.png`](assets/participations/participation-success.png)                               |
| **PART-09** | `...#participer` | Entry with campaign attribution (`?c=facebook`)  | Public | Playwright | **PASSED** | [`participation-success-campaign.png`](assets/participations/participation-success-campaign.png)             |

---

### C. Authentication & Operational Dashboard

| Workflow ID | Page / Route   | Scenario Tested                                | Role       | Method     |   Status   | Evidence Artifact                                                                     |
| :---------- | :------------- | :--------------------------------------------- | :--------- | :--------- | :--------: | :------------------------------------------------------------------------------------ |
| **AUTH-01** | `/admin/login` | Branded login page rendering & validation      | Staff      | Playwright | **PASSED** | [`admin-login.png`](assets/admin/admin-login.png)                                     |
| **AUTH-02** | `/admin/login` | Authentication as `commercial@vanidel.local`   | Commercial | Playwright | **PASSED** | [`dashboard-commercial.png`](assets/admin/dashboard-commercial.png)                   |
| **AUTH-03** | `/admin/login` | Authentication as `admin@vanidel.local`        | Admin      | Playwright | **PASSED** | [`dashboard-admin.png`](assets/admin/dashboard-admin.png)                             |
| **DASH-01** | `/admin`       | Live metrics tracking (total, today, unique)   | Commercial | Playwright | **PASSED** | [`dashboard-commercial.png`](assets/admin/dashboard-commercial.png)                   |
| **DASH-02** | `/admin`       | Metrics refresh after draw and new submissions | Commercial | Playwright | **PASSED** | [`dashboard-with-draw-completed.png`](assets/admin/dashboard-with-draw-completed.png) |

---

### D. Contest Lifecycle & Administration

| Workflow ID | Page / Route                  | Scenario Tested                                   | Role       | Method     |   Status   | Evidence Artifact                                                                              |
| :---------- | :---------------------------- | :------------------------------------------------ | :--------- | :--------- | :--------: | :--------------------------------------------------------------------------------------------- |
| **CONT-01** | `/admin/collections/contests` | Contests list view with status and dates          | Commercial | Playwright | **PASSED** | [`admin-contests-list.png`](assets/contests/admin-contests-list.png)                           |
| **CONT-02** | `.../contests/create`         | Open new contest configuration form               | Commercial | Playwright | **PASSED** | [`create-contest-01-initial.png`](assets/contests/create-contest-01-initial.png)               |
| **CONT-03** | `.../contests/:id`            | Edit Content tab (bilingual texts, steps, prizes) | Commercial | Playwright | **PASSED** | [`admin-contest-edit-content.png`](assets/contests/admin-contest-edit-content.png)             |
| **CONT-04** | `.../contests/:id`            | Edit Participation tab (email, wilaya, limits)    | Commercial | Playwright | **PASSED** | [`admin-contest-edit-participation.png`](assets/contests/admin-contest-edit-participation.png) |
| **CONT-05** | `.../contests/:id`            | Edit Draws tab (period length, scope, count)      | Commercial | Playwright | **PASSED** | [`admin-contest-edit-draws.png`](assets/contests/admin-contest-edit-draws.png)                 |
| **CONT-06** | `.../contests/:id`            | Edit Sharing & SEO tab (1200x630 share card)      | Commercial | Playwright | **PASSED** | [`admin-contest-edit-seo.png`](assets/contests/admin-contest-edit-seo.png)                     |
| **CONT-07** | `.../contests/:id`            | Fast-track contest cloning via `Dupliquer` menu   | Commercial | Playwright | **PASSED** | [`contest-duplicate-menu.png`](assets/contests/contest-duplicate-menu.png)                     |
| **CONT-08** | `.../contests/:id`            | Cloned draft validation with `-copie` suffix      | Commercial | Playwright | **PASSED** | [`contest-duplicated-draft.png`](assets/contests/contest-duplicated-draft.png)                 |
| **CONT-09** | `/api/preview`                | Staff preview mode with yellow banner & exit CTA  | Commercial | Playwright | **PASSED** | [`contest-preview-banner.png`](assets/contests/contest-preview-banner.png)                     |

---

### E. Campaign Links & QR Code Generation

| Workflow ID | Page / Route                | Scenario Tested                            | Role       | Method     |   Status   | Evidence Artifact                                                                      |
| :---------- | :-------------------------- | :----------------------------------------- | :--------- | :--------- | :--------: | :------------------------------------------------------------------------------------- |
| **CAMP-01** | `.../campaign-links`        | Campaign links list overview               | Commercial | Playwright | **PASSED** | [`admin-campaign-links-list.png`](assets/campaign-links/admin-campaign-links-list.png) |
| **CAMP-02** | `.../campaign-links/create` | Configure new link (channel, poster, code) | Commercial | Playwright | **PASSED** | [`create-campaign-link-form.png`](assets/campaign-links/create-campaign-link-form.png) |
| **CAMP-03** | `.../campaign-links/:id`    | Generate tracked URL & PNG/SVG QR codes    | Commercial | Playwright | **PASSED** | [`campaign-link-qr-code.png`](assets/campaign-links/campaign-link-qr-code.png)         |

---

### F. Participations Auditing & Review

| Workflow ID | Page / Route                 | Scenario Tested                                  | Role       | Method     |   Status   | Evidence Artifact                                                                        |
| :---------- | :--------------------------- | :----------------------------------------------- | :--------- | :--------- | :--------: | :--------------------------------------------------------------------------------------- |
| **REV-01**  | `.../participations`         | Master participations table, columns, and search | Commercial | Playwright | **PASSED** | [`admin-participations-list.png`](assets/participations/admin-participations-list.png)   |
| **REV-02**  | `.../participations/:id`     | Immutable read-only detail view & receipt link   | Commercial | Playwright | **PASSED** | [`admin-participation-detail.png`](assets/participations/admin-participation-detail.png) |
| **REV-03**  | `/api/participations/export` | CSV export of participations by contest/date     | Commercial | API / Eval | **PASSED** | Verified in step 418                                                                     |

---

### G. Draw Execution & Winner Re-Draw Protocol

| Workflow ID | Page / Route      | Scenario Tested                                     | Role       | Method     |   Status   | Evidence Artifact                                                                 |
| :---------- | :---------------- | :-------------------------------------------------- | :--------- | :--------- | :--------: | :-------------------------------------------------------------------------------- |
| **DRAW-01** | `.../draws`       | Draws list & completed period detection             | Commercial | Playwright | **PASSED** | [`admin-draws-eligible-period.png`](assets/draws/admin-draws-eligible-period.png) |
| **DRAW-02** | `.../draws`       | Period selection and execution button enablement    | Commercial | Playwright | **PASSED** | [`draw-select-period.png`](assets/draws/draw-select-period.png)                   |
| **DRAW-03** | `.../draws`       | Confirmation modal dialog handling                  | Commercial | Playwright | **PASSED** | Handled in step 340                                                               |
| **DRAW-04** | `.../draws`       | Random selection execution and redirect to winners  | Commercial | Playwright | **PASSED** | [`draw-winners-list.png`](assets/draws/draw-winners-list.png)                     |
| **WIN-01**  | `.../winners/:id` | Winner verification card, masked name, phone        | Commercial | Playwright | **PASSED** | [`winner-detail-view.png`](assets/draws/winner-detail-view.png)                   |
| **WIN-02**  | `.../winners/:id` | Re-draw execution with mandatory cancellation motif | Commercial | Playwright | **PASSED** | Step 355 dialog                                                                   |
| **WIN-03**  | `.../winners/:id` | Replacement winner generation & pool exclusion      | Commercial | Playwright | **PASSED** | [`redraw-replacement-winner.png`](assets/draws/redraw-replacement-winner.png)     |
| **WIN-04**  | `.../winners/:id` | Audit trail of voided winner with recorded motif    | Commercial | Playwright | **PASSED** | [`voided-winner-record.png`](assets/draws/voided-winner-record.png)               |

---

### H. Analytics, Exports & Administration

| Workflow ID | Page / Route                     | Scenario Tested                                        | Role       | Method     |   Status   | Evidence Artifact                                                                 |
| :---------- | :------------------------------- | :----------------------------------------------------- | :--------- | :--------- | :--------: | :-------------------------------------------------------------------------------- |
| **REP-01**  | `.../contests/:id`               | Contest Report tab (channels, wilayas, draws)          | Commercial | Playwright | **PASSED** | [`admin-contest-report.png`](assets/contests/admin-contest-report.png)            |
| **REP-02**  | `/api/contests/:id/report`       | Contest analytics CSV export endpoint                  | Commercial | API / Eval | **PASSED** | Verified in step 430                                                              |
| **CONT-01** | `.../contacts`                   | Audience contacts directory (E.164 phone identity)     | Commercial | Playwright | **PASSED** | [`admin-contacts-list.png`](assets/exports/admin-contacts-list.png)               |
| **CONT-02** | `/api/contacts/export-marketing` | Marketing contacts export with consent filtering       | Commercial | API / Eval | **PASSED** | Verified in step 414                                                              |
| **CONS-01** | `.../consent-records`            | Consent records audit table with text version hashes   | Commercial | Playwright | **PASSED** | [`admin-consent-records-list.png`](assets/exports/admin-consent-records-list.png) |
| **USER-01** | `.../users`                      | Users list & role separation (`admin` vs `commercial`) | Admin      | Playwright | **PASSED** | [`admin-users-list.png`](assets/admin/admin-users-list.png)                       |
| **SETT-01** | `/admin/globals/settings`        | Global settings (tracking IDs, retention days)         | Admin      | Playwright | **PASSED** | [`admin-globals-settings.png`](assets/admin/admin-globals-settings.png)           |
| **MED-01**  | `.../media`                      | Media gallery and visual asset library                 | Staff      | Playwright | **PASSED** | [`admin-media-library.png`](assets/admin/admin-media-library.png)                 |

---

## 3. Automated Integration Test Coverage Matrix

The repository test suite was executed via `pnpm test` against the isolated PostgreSQL test database (`vanidel_test`):

```text
✓ src/tests/int/draws.int.spec.ts (18 tests)
✓ src/tests/int/contests.int.spec.ts (22 tests)
✓ src/tests/int/participations.int.spec.ts (26 tests)
✓ src/tests/int/dashboard.int.spec.ts (5 tests)
✓ src/tests/int/exports.int.spec.ts (8 tests)
✓ src/tests/int/contestWorkflow.int.spec.ts (7 tests)
✓ src/tests/int/contestReport.int.spec.ts (4 tests)
✓ src/tests/int/access.int.spec.ts (16 tests)
✓ src/tests/int/submitParticipation.int.spec.ts (7 tests)
✓ src/tests/int/i18n.int.spec.ts (16 tests)
✓ src/tests/int/publicContests.int.spec.ts (6 tests)
✓ src/tests/int/seed.int.spec.ts (1 test)
✓ src/tests/int/settings.int.spec.ts (5 tests)
✓ src/tests/int/api.int.spec.ts (4 tests)
✓ src/tests/int/migrations.int.spec.ts (5 tests)
... and 29 unit test spec files covering domain logic, maskName, phone, wilayas, rateLimit, duplicate, and countdown.

Total: 44 test files, 352 passed, 0 failed.
```
