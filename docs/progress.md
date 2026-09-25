# VendorPulse Progress

## Part 1 - Project Setup and Connectivity

Status: Completed

### Completed

- Created React frontend using Vite.
- Created Express backend using ES modules.
- Installed backend dependencies including Express, Mongoose, Helmet, Cookie Parser, JWT and bcryptjs.
- Configured VendorPulse backend to use port 5002.
- Configured Vite `/api` proxy to forward requests to `http://localhost:5002`.
- Created `/api/health` endpoint.
- Created MongoDB Atlas cluster connection.
- Added Mongoose database connection through `src/config/db.js`.
- Backend now waits for MongoDB connection before starting the HTTP server.

### Verified

- React/Vite development server runs successfully.
- Express server runs successfully on port 5002.
- MongoDB Atlas connection succeeds.
- `/api/health` returns status 200.
- `/api/health` also works through the Vite proxy.

### Next

Part 2 - Create Mongoose models, indexes, enums and domain helpers.

## Part 2 — Data Models and Domain Rules

### Completed

- Created User model.
- Created Supplier model.
- Created KPI model.
- Created Evaluation model with embedded KPI score snapshots.
- Added shared domain constants.
- Added active KPI weight validation.
- Added weighted overall score calculation.
- Added performance rating and risk-level mapping.
- Added SHA-256 KPI criteria signature generation.

### Verified

- User, Supplier and KPI models load successfully.
- Active KPI weights totaling 100% are accepted.
- Incomplete active KPI weights are rejected.
- Weighted evaluation score calculation returns the expected result.
- Invalid weight totals are rejected.
- Performance/risk boundary values behave as expected.
- Criteria signature is independent of KPI input order.
- Changing KPI criteria changes the signature.

### VendorPulse v1 scoring rule

- 4.00–5.00: EXCELLENT / LOW
- 3.00–3.99: GOOD / MODERATE
- 2.00–2.99: NEEDS_IMPROVEMENT / HIGH
- 1.00–1.99: POOR / CRITICAL

### Next

Part 3 — Authentication and role-based authorization.

## Part 3 — Authentication and Authorization

### Completed

- Added JWT session creation and verification using HS256.
- Configured 8-hour authenticated sessions.
- Added HttpOnly `vp_session` cookie authentication.
- Added authentication middleware that verifies the JWT and loads the current user from MongoDB.
- Added active-user validation for protected requests.
- Added login, current-user (`/me`), and logout controllers.
- Added `/api/auth` routes.
- Created the initial VendorPulse Admin account with a bcrypt-hashed password.
- Added reusable role-based authorization middleware.

### Verified

- JWT creation and verification work correctly.
- Unauthenticated `/api/auth/me` returns 401.
- Valid Admin login returns 200 and sets the session cookie.
- Authenticated `/api/auth/me` returns the current user.
- Logout clears the session cookie.
- `/api/auth/me` returns 401 after logout.
- ADMIN is accepted on Admin-only routes.
- PROCUREMENT_MANAGER and VIEWER are rejected from Admin-only routes with 403.
- ADMIN and PROCUREMENT_MANAGER are accepted on Manager/Admin routes.
- VIEWER is rejected from Manager/Admin routes with 403.

### End-to-End Authentication Test

- Login → 200
- `/me` → 200
- Logout → 200
- `/me` after logout → 401

### Next

Part 4 — Supplier management API.

## Part 4 — Supplier Management API

### Completed

- Added Supplier service layer.
- Added supplier creation with server-controlled `createdBy` and ACTIVE status.
- Added paginated supplier listing.
- Added supplier search across name, contact person, email and tax ID.
- Added status and category filtering.
- Added supplier lookup by ID.
- Added partial supplier updates with an explicit editable-field allowlist.
- Added supplier archiving without deleting historical records.
- Added Supplier controllers and protected routes.
- Added role-based Supplier permissions.

### Verified

- Unauthenticated Supplier access returns 401.
- Admin can create a Supplier and receives 201.
- Supplier list returns stored suppliers with pagination metadata.
- Search returns matching suppliers and an empty result for missing values.
- ACTIVE and ARCHIVED filters work correctly.
- Valid Supplier ID returns 200.
- Malformed Supplier ID returns 400.
- Partial Supplier update returns 200 and preserves unchanged fields.
- Archive operation changes ACTIVE to ARCHIVED.
- Archived Supplier remains stored and appears under the ARCHIVED filter.

### Next

Part 5 — KPI Management API.

## Part 5 — KPI Management API

### Completed

- Added KPI service, controller, and Admin-only routes.
- Added KPI creation, listing, lookup, editing, and ACTIVE/INACTIVE status management.
- Added coordinated KPI weight adjustment.
- Added validation requiring confirmed active KPI weights to total exactly 100%.
- Added duplicate KPI ID and invalid ObjectId validation for weight updates.
- Hardened the central error handler for MongoDB duplicate-key, Mongoose validation, and cast errors.
- Prevented unexpected internal server/database messages from being exposed to API clients.

### Verified

- Unauthenticated KPI access returns 401.
- Admin can create KPIs and receives 201.
- Created Quality, Delivery, and Cost KPIs.
- KPI listing and ACTIVE/INACTIVE filtering work.
- Invalid KPI weight returns 400.
- Invalid KPI ID returns 400.
- A 90% coordinated weight update returns 400 and leaves stored weights unchanged.
- A valid 100% coordinated weight update succeeds.
- KPI editing returns 200.
- KPI ACTIVE/INACTIVE changes and filters work correctly.
- Duplicate KPI name returns 409 instead of exposing MongoDB E11000 details.
- Current active configuration is Quality 45%, Delivery 30%, Cost 25% = 100%.

### Next

Part 6 — Evaluation Configuration and Submission API.

## Part 6 — Evaluation Configuration and Submission API

### Completed

- Added evaluation configuration service and endpoint.
- Added ACTIVE supplier and ACTIVE KPI loading for evaluation entry.
- Added active KPI weight validation before submission.
- Added server-generated criteria signatures.
- Added evaluation submission for Admin and Procurement Manager roles.
- Added ACTIVE supplier validation.
- Added stale-criteria protection using `CRITERIA_CHANGED`.
- Added exact active-KPI score-set validation.
- Added duplicate KPI score prevention.
- Added score range and comment-length validation.
- Added server-controlled KPI name and weight snapshots.
- Added server-side weighted overall score calculation.
- Added server-side performance rating and risk calculation.
- Added immutable Evaluation creation.
- Added database-level duplicate supplier/year/quarter protection.
- Added evaluation listing with pagination and filters.
- Added individual evaluation result retrieval.
- Added populated Supplier and evaluator information.
- Added specific duplicate-evaluation and criteria-change error responses.

### Verified

- Unauthenticated evaluation submission returns 401.
- Evaluation configuration returns the current active KPI configuration.
- Active KPI total is 100% and criteria signature is generated.
- Archived suppliers cannot be evaluated.
- Valid evaluation submission returns 201.
- Test evaluation produced overall score 4.2, EXCELLENT rating, and LOW risk.
- Stored KPI snapshots contain the accepted KPI names and weights.
- Duplicate supplier/year/quarter submission returns 409.
- Stale criteria signature returns 409 with `CRITERIA_CHANGED`.
- Evaluation list and period filtering work.
- Individual evaluation retrieval works.
- Invalid evaluation ID returns 400.

### Next

Part 7 — User Management API.

## Part 7 — User Management API

### Completed

- Added Admin-only user management API.
- Added user listing with pagination, search, role and status filters.
- Added Admin-created users with bcrypt password hashing.
- Added Procurement Manager and Viewer account creation.
- Added user name, role and status updates.
- Prevented passwordHash from being exposed through API responses.
- Added safeguards preventing existing Admin accounts from being demoted or deactivated.
- Added invalid and missing user handling.

### Verified

- Procurement Manager creation returns 201.
- Viewer creation returns 201.
- User listing returns all users without passwordHash.
- Non-admin user editing works.
- Non-admin user deactivation works.
- Admin demotion is rejected.
- Admin deactivation is rejected.
- Invalid user ID returns 400.

### Next

Part 8 — Role authorization verification and Dashboard API.

## Part 8 — Dashboard API

### Completed

- Added dashboard endpoint for all authenticated roles.
- Added selected year and quarter filtering.
- Added current active supplier count.
- Added evaluated supplier count for the selected period.
- Added HIGH/CRITICAL risk count.
- Added rating distribution with all four rating groups.
- Added five most recent evaluations with supplier and evaluator data.
- Added correct empty-state dashboard data.

### Verified

- Dashboard returns correct 2026 Q3 data.
- Existing Nova evaluation appears with overall score 4.2.
- EXCELLENT distribution count is correct.
- Empty period returns zero evaluation metrics and no recent evaluations.
- Viewer can access the dashboard.

### Next

Part 9 — Supplier Comparison API.

## Part 9 — Supplier Comparison API

### Completed

- Added supplier comparison endpoint for all authenticated roles.
- Supports exactly 2 or 3 distinct suppliers.
- Added year and quarter validation.
- Requires every selected supplier to have an evaluation for the selected period.
- Added `MISSING_EVALUATION` response with missing supplier IDs.
- Requires matching criteria signatures across evaluations.
- Added `INCOMPATIBLE_CRITERIA` protection.
- KPI scores are matched using KPI IDs rather than array positions.
- Comparison returns KPI names, weights, scores, overall scores, ratings and risk levels.
- No artificial winner or tiebreaker is generated.

### Verified

- Single-supplier comparison is rejected with 400.
- Second supplier evaluation was successfully submitted.
- Two evaluated suppliers can be compared for the same period.
- Comparison returns the expected supplier and KPI results.
- Supplier without an evaluation returns 400 with `MISSING_EVALUATION`.

### Next

Part 10 — Reports API and CSV export.

## Part 10 — Reports API and CSV Export

### Completed

- Added evaluation reports endpoint for all authenticated roles.
- Added supplier, year and quarter filtering.
- Added paginated screen report results.
- Added CSV export using the same report filters.
- Added CSV escaping for commas, quotes and line breaks.
- Added a 10,000-row export limit.
- Reports include supplier, category, period, overall score, rating, risk, evaluator and submission time.
- Export rejects oversized reports instead of silently truncating them.

### Verified

- 2026 Q3 report returns Nova Supplies and Orion Industries.
- Report pagination total is correct.
- Supplier filtering returns only the selected supplier.
- CSV export contains all matching Q3 evaluations.
- CSV supplier filtering matches the screen report filtering.

### Next

Part 11 — Backend hardening and completion audit.

## Part 11 — Backend Hardening

### Completed

- Normalized optional supplier fields, including blank tax IDs.
- Added type validation for evaluation and KPI comments.
- Placed the public health endpoint before protected routes.
- Organized KPI routes with static routes before parameterized routes.
- Reviewed backend routes and role permissions.

### Verified

- Backend starts and connects to MongoDB.
- Public health endpoint returns 200.
- All nine protected endpoints passed the regression checks.
- Numeric evaluation comments return 400.
- Invalid KPI weight updates return 400.
- Git secret check completed.

### Next

Part 12 — React frontend foundation.

## Frontend F1 — Foundation and Application Shell

Status: Completed

### Completed

- Verified read access to the `VendorPulse`, `VendorPulse-UI`, and `FSD` workspaces without modifying the reference folders.
- Visually reviewed all 19 supplied UI screens and mapped them to frontend routes.
- Audited the implemented Express routes, service response shapes, model fields, role permissions, and error codes used by the frontend.
- Added React Router and Lucide React while preserving the existing Vite setup and lockfile.
- Added a centralized `/api` request helper with query serialization, JSON/error handling, and `credentials: "include"` for the HttpOnly session cookie.
- Added authentication context with login, logout, and session restoration through `GET /api/auth/me`.
- Added protected routes and Admin-only route guards.
- Added the complete frontend route map for Dashboard, Suppliers, Evaluations, Compare, Reports, KPI Management, and User Management.
- Added role-aware workspace and administration navigation.
- Added the shared responsive header, sidebar, profile menu, logout flow, page container, and mobile navigation.
- Added the supplied VendorPulse logo as a production client asset.
- Added centralized visual tokens and reusable page header, button, form, status, loading, empty, and error-state styles/components.
- Added a functional login screen matching the supplied design direction.
- Added phase placeholders so unfinished feature routes remain explicit without mock application data.

### Reference and Contract Findings

- `docs/requirements.md`, `docs/api.md`, `docs/data-model.md`, and `docs/test-evidence.md` are currently empty; the backend implementation is the functional source of truth.
- Supplier evaluation history requires combining `GET /api/suppliers/:id` with `GET /api/evaluations?supplierId=:id`.
- The user edit endpoint does not support email changes, so the email displayed on the edit screen must be read-only.
- Evaluation review is a client-side preview; the server remains authoritative when the evaluation is submitted.
- Reporting period defaults must be derived by the client because the backend does not provide a current-period endpoint.

### Verified

- `npm run lint` passes.
- `npm run build` passes.
- The production build contains the React application and optimized VendorPulse logo asset.
- Browser verification confirms the login layout renders correctly at desktop and 390px mobile widths without horizontal overflow.
- Browser verification confirms empty login validation and unauthenticated protected-route redirects.

### Next

Frontend F2 — Implement the live Dashboard and complete its data, loading, empty, and error states.

## Frontend F2 — Login and Dashboard

Status: Completed

### Files Changed

- `client/src/App.jsx`
- `client/src/App.css`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/DashboardPage.jsx`
- `client/src/pages/DashboardPage.css`
- `docs/progress.md`

### Completed

- Replaced the Dashboard phase placeholder with a production Dashboard page connected to `GET /api/dashboard`.
- Added a reporting-period selector covering the current and previous 15 quarters.
- Added the Active suppliers, Suppliers evaluated, and High / critical risk summary cards using live backend metrics.
- Added the four-category rating distribution while preserving categories whose count is zero.
- Added recent evaluation rows with server-calculated scores, rating and risk formatting, and links to the read-only evaluation result routes.
- Added a screenshot-aligned dashboard grid, panels, progress bars, table, status chips, responsive layout, and loading skeleton.
- Added dashboard retry handling, background period-refresh feedback, accurate stale-period labeling after a failed refresh, and an empty recent-evaluations state.
- Added expired-session handling that re-runs session restoration when the Dashboard receives a 401 response.
- Refined Login with field-specific required validation, email format validation, accessible error associations, backend authentication messages, and full intended-route restoration after sign-in.
- Removed the extra Login security icon to match the supplied screenshot more closely.
- Continued to use the existing HttpOnly cookie session flow without browser storage.

### Verified

- `npm run lint` passes.
- `npm run build` passes.
- Invalid API login returns 401 with `Invalid email or password`.
- Browser verification confirms required-field errors and the invalid-credentials message appear correctly.
- Browser verification confirms the final Login screen matches the supplied layout at desktop width without horizontal overflow.
- Read-only integration checks using active database users and the existing JWT helper confirm `/api/auth/me` and `/api/dashboard?year=2026&quarter=3` return 200 for Admin, Procurement Manager, and Viewer.
- The real Q3 2026 Dashboard response contains live metrics, all four rating keys, and recent evaluations.
- Switching to the real empty Q2 2026 period returns zero evaluated suppliers, zero risk count, all-zero rating categories, and no recent evaluations.
- Logout returns 200 and the cleared session cookie produces 401 from `/api/auth/me`.

### Not Verified

- Successful login through the browser could not be tested because the current server environment does not contain usable test login credentials.
- Authenticated Dashboard visual verification in the browser could not be completed for the same reason. Its layout was implemented directly from the supplied screenshot and its data contract was verified against the running backend.
- Inactive-account login messaging could not be exercised because no credentials for an inactive account were available; the UI displays the backend's 403 message without rewriting it.

### Next

Frontend F3 — Implement Supplier list, details, add, and edit screens.

## Frontend F3 — Supplier Management

Status: Completed

### Files Changed

- `client/src/App.jsx`
- `client/src/components/ConfirmDialog.jsx`
- `client/src/components/Pagination.jsx`
- `client/src/pages/SuppliersPage.jsx`
- `client/src/pages/SupplierDetailsPage.jsx`
- `client/src/pages/SupplierFormPage.jsx`
- `client/src/pages/SupplierPages.css`
- `client/src/suppliers/supplierUtils.js`
- `docs/progress.md`

### Completed

- Replaced the Supplier placeholders with production list, detail, add, and edit pages connected to the existing Supplier API.
- Added live supplier search across the backend-supported name, contact, email, and tax-ID fields.
- Added exact category filtering, ACTIVE/ARCHIVED/all status filtering, backend pagination, refresh feedback, loading skeletons, retry handling, and filtered empty states.
- Added supplier detail presentation for contact, address, tax ID, and partial or complete contract periods.
- Added paginated evaluation history by combining `GET /api/suppliers/:id` with `GET /api/evaluations?supplierId=:id`.
- Added create and edit forms with required name/category validation, email validation, contract-date ordering, trimmed payload values, backend duplicate-tax-ID messaging, and success feedback.
- Added a confirmation dialog for the one-way archive action and retained archived suppliers for historical detail and evaluation-result viewing.
- Restricted add, edit, archive, and evaluate controls/routes to Admin and Procurement Manager. Viewer retains read-only list, detail, and evaluation-history access.
- Hid the Evaluate supplier action for archived records, matching the backend rule that only ACTIVE suppliers can be evaluated.
- Added responsive supplier tables, forms, details, action groups, filters, and pagination using the existing F1/F2 tokens and shared layout.

### Reference and Contract Findings

- The supplied list screenshot says “Search name or category,” but backend text search does not include category. The frontend uses an accurate search placeholder and a separate exact-match category filter backed by the existing `category` query parameter.
- Supplier detail responses do not embed evaluation history, so the detail screen makes a separate paginated evaluation-list request.
- The backend supports editing archived supplier details but provides no unarchive or permanent-delete route. The frontend therefore allows authorized edits while omitting evaluation and archive actions after archiving.
- Pagination, confirmation, validation, error, and empty-state presentations are inferred from the established VendorPulse design system because dedicated reference screenshots were not provided for those states.

### Verified

- `npm run lint` passes.
- `npm run build` passes.
- Supplier form checks cover required name/category, email format, contract-date ordering, and payload trimming.
- A real, clearly named F3 test supplier was created by Admin and archived at the end of testing; unrelated supplier data was not changed.
- Real API checks passed for text search, exact category filtering, ACTIVE/ARCHIVED filtering, pagination metadata, individual details, and supplier evaluation history.
- Duplicate tax ID returns 409 with the expected clear message.
- Invalid contract date order returns 400 with the expected validation message.
- Procurement Manager can edit and archive suppliers.
- Viewer can list suppliers, search/filter, open details, and read evaluation history, while create, edit, and archive requests return 403.
- The archived test supplier remains available under the ARCHIVED filter and for Viewer detail access, is absent from ACTIVE results, and is excluded from evaluation configuration.
- Browser verification confirms an unauthenticated Supplier URL restores the existing protected-route behavior and redirects to Login without console errors.

### Not Verified

- Authenticated visual comparison and interactive add/edit/archive checks could not be completed in the browser because the available browser session was signed out and no usable test login credentials are stored in the project. The implementation was visually derived from supplier screenshots 03–06 and the live data/role behavior was verified through the running API.

### Next

Frontend F4 — Implement KPI Management and coordinated weights.

## Frontend F4 — KPI Management

Status: Completed

### Files Changed

- `client/src/App.jsx`
- `client/src/kpis/kpiUtils.js`
- `client/src/pages/KpisPage.jsx`
- `client/src/pages/KpiFormPage.jsx`
- `client/src/pages/KpiWeightsPage.jsx`
- `client/src/pages/KpiPages.css`
- `docs/progress.md`

### Completed

- Replaced all KPI placeholders with Admin-only production pages connected to the existing KPI API.
- Added the live KPI list with criterion name, weight, status, edit links, loading skeleton, retry handling, and an empty state.
- Added a live active-weight summary that clearly distinguishes a valid 100% evaluation configuration from an invalid total.
- Added screenshot-aligned Add KPI and Edit KPI forms with name, optional description, weight, and ACTIVE/INACTIVE status controls.
- Added client validation for required names and numeric weights greater than 0 and no more than 100, while retaining backend duplicate-name and validation messages.
- Kept single-KPI edits independent; the frontend never silently redistributes other KPI weights.
- Added an active-only coordinated weight editor that submits all displayed weights through `PUT /api/kpis/weights` and requires a live total of exactly 100%.
- Added explicit future-evaluation and historical-snapshot messaging so the interface does not imply that existing evaluation results change.
- Added loading, success, validation, API error, and no-active-KPI states using the existing application shell and design tokens.
- Preserved the existing Admin route guard for all KPI list, add, edit, and weight routes.

### Reference and Contract Findings

- `GET /api/kpis` returns `{ kpis }` without an active total, so the frontend calculates the total from ACTIVE records.
- Individual create/edit requests validate only the affected KPI and may leave the active total temporarily different from 100%; the frontend displays that condition rather than changing other records automatically.
- `PUT /api/kpis/weights` accepts `{ updates: [{ id, weight }] }`, validates the resulting complete ACTIVE configuration, and returns `{ kpis, totalActiveWeight }`.
- KPI activation and deactivation use the general `PATCH /api/kpis/:id` endpoint; there is no separate status endpoint or deletion route.
- Historical evaluations retain embedded KPI name and weight snapshots and are not rewritten when current KPI definitions change.

### Verified

- `npm run lint` passes.
- `npm run build` passes.
- Client-side checks pass for required names, valid and invalid weight boundaries, payload normalization, and active-total calculation.
- Admin can list, create, read, edit, activate, and deactivate a clearly named F4 test KPI.
- Duplicate KPI names return 409 with the expected clear message, and a weight greater than 100 returns 400.
- Procurement Manager and Viewer receive 403 for KPI list access; Viewer creation and Procurement Manager editing also return 403.
- An invalid coordinated 101% update returns 400 and leaves every stored weight unchanged.
- A valid coordinated 100% update succeeds through the weights endpoint.
- The test KPI was returned to INACTIVE status. The pre-existing active KPI IDs, statuses, and weights match their pre-test values.
- The final evaluation configuration is valid and the active KPI total is exactly 100%.
- The retained test record is clearly identifiable and inactive (`6ab3c77b9b3ce3d89dd011b0`).
- Browser verification confirms an unauthenticated direct `/kpis` URL redirects to Login without console errors.

### Not Verified

- Authenticated screenshot comparison and direct-URL redirects for logged-in Procurement Manager and Viewer accounts could not be exercised in the available browser because it had no authenticated session or usable credentials. Server-side 403 behavior was verified for both roles, and every KPI route remains inside the existing Admin-only `ProtectedRoute`.

### Next

Frontend F5 — Implement Evaluations.

## Frontend F5 — Evaluations

Status: Completed

### Files Changed

- `client/src/App.jsx`
- `client/src/evaluations/evaluationUtils.js`
- `client/src/pages/EvaluationsPage.jsx`
- `client/src/pages/EvaluationFormPage.jsx`
- `client/src/pages/EvaluationReviewPage.jsx`
- `client/src/pages/EvaluationResultPage.jsx`
- `client/src/pages/EvaluationPages.css`
- `docs/progress.md`

### Completed

- Replaced all Evaluation placeholders with production list, create, review, and immutable result screens connected to the existing Evaluation API.
- Added evaluation listing for all authenticated roles with supplier/year/quarter filters, backend pagination, loading skeleton, refresh errors, success feedback, and filtered/no-data states.
- Added Manager/Admin-only create and review routes while preserving all-role history and result access.
- Added dynamic ACTIVE supplier and KPI loading through `GET /api/evaluation-config`, including invalid-active-weight handling.
- Added required supplier/period validation, one integer score from 1–5 for every active KPI, optional 500-character KPI comments, and optional 2,000-character overall comments.
- Added a live weighted-score, performance-rating, and risk preview using the current server-provided KPI weights while keeping the backend authoritative at submission.
- Added the client-side review screen with supplier, period, score, weight, KPI comments, overall comments, and an explicit immutable-submission warning.
- Added final submission through `POST /api/evaluations`, clear duplicate-period errors, and no edit/delete affordances after submission.
- Added `CRITERIA_CHANGED` recovery that fetches the new configuration, preserves scores/comments only for unchanged KPI IDs, drops removed criteria, leaves new criteria unscored, and requires another review before resubmission.
- Added the read-only result screen using saved `kpiNameSnapshot` and `weightSnapshot` values rather than current KPI definitions.
- Added screenshot-aligned evaluation tables, scoring rows, review/result score cards, status messaging, and responsive layouts using the established design system.

### Reference and Contract Findings

- The review screen is entirely client-side because the backend has no draft or review endpoint; draft data is passed in router state and is never stored in browser storage.
- `GET /api/evaluation-config` is limited to Admin and Procurement Manager and returns only ACTIVE suppliers/KPIs plus the criteria signature and weight validity.
- `GET /api/evaluations` supports only supplier ID, year, quarter, page, and limit filters. The frontend loads supplier options separately because the list response has no filter metadata endpoint.
- Per-KPI comments, list filters/pagination, validation states, and criteria-change recovery have no dedicated screenshots and are inferred from the existing VendorPulse design system.
- The result endpoint returns immutable score snapshots with populated supplier/evaluator details; current KPI lookups are intentionally not used for historical display.

### Data-State Correction

- Initial F5 verification found an unexpected ACTIVE `Speed` KPI at 1%, making the live evaluation configuration total 101% despite the stated Quality 45%, Delivery 30%, Cost 25% baseline.
- The `Speed` record was deactivated—not deleted—through the existing KPI API. The Codex F4 KPI remains inactive, and the final active configuration is exactly Quality 45%, Delivery 30%, and Cost 25%.

### Verified

- `npm run lint` passes.
- `npm run build` passes.
- Client checks pass for required fields, score boundaries, comment limits, exact 4.20 weighted preview, payload construction, and unchanged-KPI-ID reconciliation.
- Admin and Procurement Manager can load the valid evaluation configuration; Viewer receives 403.
- Viewer submission receives 403, while Procurement Manager successfully submitted the single permanent F5 test evaluation.
- A score outside 1–5 is rejected, an archived supplier is rejected, a stale signature returns 409 with `CRITERIA_CHANGED`, and a duplicate supplier/year/quarter returns 409.
- Admin, Procurement Manager, and Viewer can filter and paginate evaluation history and retrieve the read-only result.
- The client preview and backend authoritative result both equal 4.20, EXCELLENT, LOW for the submitted 45/30/25 test scores.
- Overall and per-KPI comments are stored and returned.
- Temporary coordinated current-weight and KPI-name changes left the submitted snapshot names/weights unchanged; the original current KPI name and weights were restored afterward.
- The F5 test supplier was archived after submission and is excluded from future evaluation configuration while its result remains readable.
- Final evaluation configuration is valid at exactly 100% with Quality 45%, Delivery 30%, and Cost 25%.
- Permanent test supplier: `6ab3f65e9b3ce3d89dd011b4`; permanent Q4 2099 evaluation: `6ab3f65f9b3ce3d89dd011b5`.
- Browser verification confirms an unauthenticated direct `/evaluations/new` URL redirects to Login without console errors.

### Not Verified

- Authenticated screenshot comparison and logged-in Viewer direct-route navigation could not be exercised because the only available browser session was signed out and no usable test credentials are stored. API permissions, role-aware controls, and the Manager/Admin `ProtectedRoute` were verified instead.

### Next

Frontend F6 — Implement Compare and Reports.

## Frontend F6 — Compare and Reports

Status: Completed

### Files Changed

- `client/src/App.jsx`
- `client/src/App.css`
- `client/src/api/client.js`
- `client/src/comparison/comparisonUtils.js`
- `client/src/components/RiskBadge.jsx`
- `client/src/suppliers/supplierApi.js`
- `client/src/pages/ComparePage.jsx`
- `client/src/pages/ReportsPage.jsx`
- `client/src/pages/CompareReports.css`
- `client/src/pages/DashboardPage.jsx`
- `client/src/pages/DashboardPage.css`
- `client/src/pages/EvaluationsPage.jsx`
- `docs/progress.md`

### Completed

- Replaced the Compare and Reports placeholders with production screens connected to the existing backend APIs.
- Added comparison selection for exactly two or three distinct suppliers, with year/quarter controls, client validation, loading/empty/error states, and responsive horizontal table scrolling.
- Added side-by-side display of saved KPI names, weights, KPI scores, overall scores, performance ratings, and risk levels without calculating rankings or inventing missing values.
- Added explicit, useful handling for `MISSING_EVALUATION` and `INCOMPATIBLE_CRITERIA` responses.
- Added the evaluation report table with supplier, category, period, score, rating, risk, evaluator, submitted date, result navigation, backend pagination, and supplier/year/quarter filters.
- Added credentialed CSV downloads through the centralized API helper. Exports use the applied report filters, surface backend failures, and retain the backend filename/CSV contract.
- Added a shared `RiskBadge` and reused it on Dashboard, Compare, and Reports while retaining the shared performance `RatingBadge` for all ratings.
- Extracted the existing paginated supplier-option loader for reuse by Evaluations, Compare, and Reports.
- Kept Compare and Reports under the existing authenticated application shell so Admin, Procurement Manager, and Viewer receive the same permitted access.

### Reference and Contract Findings

- `GET /api/comparisons` accepts repeated or comma-separated `supplierIds` plus `year` and `quarter`, and requires exactly two or three distinct supplier IDs.
- The comparison response supplies the authoritative overall classifications and immutable KPI snapshot rows; the frontend does not recompute results or choose a winner, so ties are preserved.
- `GET /api/reports/evaluations` and `GET /api/reports/evaluations.csv` support supplier ID, year, and quarter filters only. Rating and risk filters are not implemented because the backend does not accept them.
- The report response includes populated supplier and evaluator records in addition to score, rating, risk, period, and submission timestamps. The Reports screenshot shows a smaller column set; the extra backend-supported fields use the established table design and horizontal scrolling.
- CSV export is capped by the backend at 10,000 rows and returns a clear narrowing-filters error above that limit.
- Compare and Reports are authorized for all three current roles by the backend routes.

### Verified

- `npm run lint` passes.
- `npm run build` passes.
- Client checks pass for two/three-supplier validation, duplicate prevention, repeated `supplierIds` serialization, missing/incompatible comparison messaging, and CSV URL serialization with active supplier/year/quarter filters.
- Admin, Procurement Manager, and Viewer each receive 200 responses from comparison and reporting endpoints.
- Nova Supplies versus Orion Industries for Q3 2026 returns 4.20 / EXCELLENT / LOW and 3.85 / GOOD / MODERATE respectively.
- Every returned Nova/Orion KPI name, weight, and score matches its stored historical evaluation snapshot.
- Backend requests with a duplicate supplier, fewer than two suppliers, or more than three suppliers each return 400; the UI also prevents duplicate checkbox choices and disables additional choices at three.
- A supplier without an evaluation returns 400 with `MISSING_EVALUATION`, and the client identifies the missing supplier/period in its message.
- Report filtering by Q3 2026 returns the two expected records for every role; filtering by Nova Supplies returns exactly one matching record.
- Backend report pagination was verified with a one-record page size across pages 1 and 2.
- Filtered CSV export contains the expected header and Nova record while excluding Orion; period-only export contains both Q3 2026 records.
- Direct unauthenticated browser navigation to both `/compare` and `/reports` redirects to Login.
- F6 API verification performed zero database writes; no supplier, KPI, evaluation, or user records were changed.

### Not Verified

- No existing pair of evaluations in the same period has different criteria signatures, so a live 409 `INCOMPATIBLE_CRITERIA` response could not be produced without changing permanent data. The backend branch was inspected and the client error mapping was verified directly.
- The 10,000-row CSV export limit could not be exercised because the development dataset is much smaller; its backend contract and frontend error propagation were inspected.
- Authenticated browser interaction, screenshot-level visual comparison, and live small-viewport checks could not be completed because the available browser session is signed out and no usable credentials are stored in the project. These require manual verification.

### Next

Await manual F6 verification before starting Frontend F7 — User Management.

## Frontend F7 — User Management

Status: Completed

### Files Changed

- `client/src/App.jsx`
- `client/src/components/UserBadges.jsx`
- `client/src/users/userApi.js`
- `client/src/users/userUtils.js`
- `client/src/pages/UsersPage.jsx`
- `client/src/pages/UserFormPage.jsx`
- `client/src/pages/UserPages.css`
- `docs/progress.md`

### Completed

- Replaced the final User Management placeholders with Admin-only list, add, and edit screens connected to the existing User API.
- Added user listing with backend-supported name/email search, role filtering, status filtering, pagination, loading skeleton, retry handling, filtered/no-data states, and success feedback.
- Added consistent role badges for Admin, Procurement Manager, and Viewer plus active/inactive account status badges.
- Added the Add User form with name, email, temporary password, and role fields; required-field, email-format, minimum-eight-character password, and role validation; duplicate-email field feedback; and no password logging or browser storage.
- Added the Edit User form with existing values, name/role/status updates, immutable read-only email, loading/retry states, and list feedback after successful saves.
- Added protected Admin account behavior: role and status controls are disabled for existing Admin accounts, with explicit explanations that they cannot be demoted or deactivated.
- Added current-session refresh after editing the signed-in Admin's own name so the shared header remains current.
- Preserved the existing Admin-only route guard and Admin-only sidebar navigation for list, add, and edit routes.
- Removed the obsolete placeholder routing helper now that every F1–F7 screen has a production component.

### Reference and Contract Findings

- `GET /api/users` supports page, limit, search, role, and status. Search covers user name and email.
- The backend has no `GET /api/users/:id` endpoint. Direct Edit User navigation therefore locates the requested user through paginated Admin list responses.
- `POST /api/users` requires name, email, a password of at least eight characters, and one of the three defined roles; new accounts are always ACTIVE.
- The backend checks email presence and uniqueness but does not validate email syntax. The frontend supplies the explicitly requested basic email-format validation before submission.
- `PATCH /api/users/:id` supports name, role, and status only. Email and password updates are not part of the contract, so edit email is displayed read-only and no password field is shown.
- Existing Admin accounts may change name but cannot be demoted or deactivated. The frontend locks those controls and the backend independently rejects prohibited payloads.
- User Management screenshots do not show search/filter controls although the backend supports them and F7 requests them. Their layout is inferred from the established Supplier/Evaluation filter design.
- `docs/api.md`, `docs/requirements.md`, and `docs/data-model.md` remain empty; the implemented routes, controllers, service validation, model, and existing progress history were used as the contract source.

### Verified

- `npm run lint` passes.
- `npm run build` passes.
- Client checks pass for required fields, invalid email format, password length, role validation, payload normalization, omission of email/password from edit payloads, protected-Admin detection, and duplicate-email field mapping.
- Admin receives the paginated user list with name, email, role, and status, and `GET /api/users` does not include `passwordHash`.
- Search, all three role filters, ACTIVE/INACTIVE status filters, invalid-filter rejection, and pagination across distinct records were verified through the live API.
- Procurement Manager and Viewer each receive 403 for `GET /api/users`.
- Missing-password and invalid-role creation requests return 400, and duplicate email returns 409 with no user created.
- Existing Admin demotion and deactivation requests return 400; the Admin record remains ADMIN/ACTIVE afterward.
- The database user count and existing account records were unchanged by F7 verification.
- Direct unauthenticated browser navigation to `/users`, `/users/new`, and `/users/:id/edit` redirects to Login.

### Resolved Backend Security Issue

- A newly created Mongoose `User` document previously serialized `passwordHash`, and `createUser` returns that document directly from `POST /api/users`.
- After approval, a schema-level `toJSON` transform was added so create, list, and patch response documents consistently remove `passwordHash` during API serialization while retaining the stored field for authentication.
- Query-level `select: false` remains in place, and the authentication flow still explicitly selects the hash only for password verification.

### Not Verified

- Successful user creation, profile/role/status updates, and deactivation were not executed because they would write to the shared database and no write approval was requested or granted. Validation and guaranteed-rejected safeguards were tested with a confirmed zero record-count change.
- No INACTIVE account currently exists, so live inactive-session rejection could not be verified without changing existing data. The authentication middleware was inspected and rejects inactive accounts with 403.
- Authenticated screenshot comparison, signed-in direct-route behavior, and live small-viewport checks could not be completed because the available browser session has no usable credentials. Backend authorization, sidebar conditions, route guards, and unauthenticated redirects were verified.

### Next

Await manual F7 verification. Do not start F8 yet.

## F7 Security Follow-up — User Response Sanitization

Status: Completed

### Files Changed

- `server/src/models/User.js`
- `server/test/userSerialization.test.js`
- `server/package.json`
- `docs/progress.md`

### Completed

- Added a User schema `toJSON` transform that removes `passwordHash` from all serialized User documents.
- Preserved `passwordHash` in the Mongoose document and MongoDB schema so login password verification remains unchanged.
- Preserved the existing default query exclusion through `select: false`.
- Added dependency-free Node regression tests for direct User serialization and the create, list, and patch API response shapes.
- Added the server `npm test` script using Node's built-in test runner.

### Verified

- `npm test` passes 3/3 server regression tests.
- Regression tests confirm the document retains its hash internally while `toJSON` and `JSON.stringify` omit both the `passwordHash` key and value.
- Regression tests confirm representative `POST /api/users`, `GET /api/users`, and `PATCH /api/users/:id` response shapes never serialize `passwordHash`.
- Regression tests confirm `passwordHash` remains `select: false` for User queries by default.
- `node --check` passes for the User model, user controller, and user service.
- Frontend `npm run lint` passes.
- Frontend `npm run build` passes.
- No database connection was opened and no user records were created or modified during this security fix.

### Next

Await manual F7 verification. Do not start F8 yet.

## Pre-F8 Polish — Dashboard Card and PDF Performance Reports

Status: Completed

### Files Changed

- `client/src/api/client.js`
- `client/src/pages/DashboardPage.jsx`
- `client/src/pages/DashboardPage.css`
- `client/src/pages/ReportsPage.jsx`
- `client/src/pages/CompareReports.css`
- `server/package.json`
- `server/package-lock.json`
- `server/src/routes/reportRoutes.js`
- `server/src/controllers/reportController.js`
- `server/src/services/reportService.js`
- `server/src/reports/evaluationPdfReport.js`
- `server/test/reportPdf.test.js`
- `docs/api.md`
- `docs/progress.md`

### Completed

- Removed the Dashboard-only featured-card override so Active suppliers now shares the same readable white-surface title, metric, and helper-text hierarchy as Suppliers evaluated for every role and viewport.
- Added authenticated `GET /api/reports/evaluations.pdf` access for Admin, Procurement Manager, and Viewer with the existing supplier/year/quarter report filters.
- Added PDFKit as the single new server dependency and kept PDF creation in memory without persistent server files or chart-library dependencies.
- Kept report filtering in `reportService.js` and isolated PDF presentation in `evaluationPdfReport.js`; Dashboard, Compare, evaluation formulas, authentication, authorization, and CSV business logic were not changed.
- Added a VendorPulse-branded A4 executive first page with scope metadata, UTC generated timestamp, summary cards, rating/risk distributions, and overall-score bars for multi-evaluation reports.
- Added snapshot-based KPI analysis grouped by compatible criteria signatures. Incompatible historical configurations receive human-readable configuration labels and are never averaged together or printed as raw signatures.
- Added formal detailed evaluation pages with supplier/category/period, overall score, saved rating and risk, evaluator, submitted timestamp, KPI snapshot name/weight/score/comment, and non-empty overall comments.
- Added intentional single-evaluation and empty-report layouts, repeating report headers, `Generated by VendorPulse` footers, and `Page X of Y` numbering.
- Added an Export PDF action beside the unchanged Export CSV action. Both use the applied Reports filters; shared download handling now accepts the expected MIME type while preserving cookie authentication and existing CSV filename/behavior.
- Added error/loading protection that prevents repeated export clicks and surfaces PDF generation failures without leaving the Reports page.
- Documented the endpoint, access roles, filters, export distinction, 500-evaluation PDF safety limit, snapshot/criteria behavior, and empty state in `docs/api.md`.

### Verified

- `npm run lint` passes in `client`.
- `npm run build` passes in `client` with Vite 8.3.0.
- `npm test` passes in `server`: 11 tests, 0 failures.
- Unit coverage verifies shared report filter validation, complete zero-preserving rating/risk distributions, summary calculations, snapshot names/weights, compatible KPI averages, criteria-group separation, absence of raw IDs/signatures from the presentation model, snapshot independence from current KPI definitions, safe filenames, long content, PDF buffers, authenticated routing, all three allowed roles, and the earlier user-response security regressions.
- Read-only live integration verification confirms unauthenticated PDF requests return 401 and active Admin, Procurement Manager, and Viewer accounts each receive a 200 `application/pdf` response.
- Q3 2026 live report verification returns the expected two records and PDF content for Nova Supplies and Orion Industries. Supplier-filtered export contains Nova only; the empty Q1 2098 scope produces the intended no-results report.
- Existing JSON Reports API still returns two Q3 2026 records. Existing CSV export still returns `text/csv`, the unchanged header, and both expected Q3 records; its generated content was 299 bytes during verification.
- PDF metadata and rendering were inspected for multi-supplier, one-supplier, empty, and synthetic long-name/long-comment cases. All use A4 boundaries. The observed page counts were 4, 3, 1, and 4 respectively, with clean page breaks, wrapped text, aligned badges/charts, readable colors, and complete headers/footers/page numbering.
- Extracted PDF text contains saved historical KPI names/weights and does not print raw criteria signatures, MongoDB/ObjectId labels, API paths, or authentication details.
- Verification queried existing records only. No supplier, KPI, evaluation, or user records were created, updated, or deleted.
- The Dashboard card fix is role-independent because all three roles render the same shared Dashboard component and summary-card class; the existing responsive summary grid remains unchanged.

### Limitations / Manual Follow-up

- The available browser session was signed out, so authenticated click-through of Export PDF and a live Dashboard desktop/narrow screenshot comparison could not be repeated in the in-app browser. The frontend build, role-independent source path, endpoint integration, generated files, and rendered PDF pages were verified directly.
- The development database has no same-scope evaluations with incompatible criteria. Criteria separation was therefore verified with automated fixtures rather than by modifying immutable live evaluations.
- The 500-evaluation PDF safety limit was not exercised against the small live dataset; its service branch and client error propagation were inspected and the limit is documented.

### Next

Await manual verification of this pre-F8 checkpoint. F8 has not started.

## F8 — Final Integration, Regression, Security, and Release Readiness

Status: Completed with explicit manual follow-up noted below

All implementation phases F1 through F7 and the pre-F8 PDF/report polish remain complete. F8 did not start the separate clean-database/final-initialization stage.

### Files Changed

- `client/index.html`
- `server/.env.example`
- `server/test/authController.test.js`
- `server/test/comparisonService.test.js`
- `README.md`
- `docs/api.md`
- `docs/progress.md`

### Fixes and Coverage Added

- Corrected the browser title from the Vite scaffold value to `VendorPulse`.
- Added focused comparison regression coverage for incompatible historical criteria, the two-or-three supplier rule, and duplicate supplier selection.
- Added focused authentication controller coverage for successful password verification and cookie issuance, invalid credentials, inactive-account rejection, public-only user serialization, and logout cookie clearing.
- Corrected the documented server port in `server/.env.example` from 5000 to the implemented port 5002.
- Added a project README and expanded the API documentation to cover setup, roles, modules, authentication, authorization, immutable evaluation snapshots, criteria compatibility, CSV/PDF behavior, testing, and security boundaries.

### Post-Rotation Authentication and Security Verification

- The JWT signing secret was rotated by the project owner and the backend was restarted without disclosing or reading back the value.
- No pre-rotation cookie remained available after the cookie-jar cleanup, so replay of the exact old session was not possible. A wrong-signature token and an expired token were each rejected with 401, as were malformed and missing sessions.
- Newly signed live sessions using the restarted server configuration were accepted by `/api/auth/me` for active Admin, Procurement Manager, and Viewer accounts.
- Logout cleared the session and a subsequent request without the cookie returned 401.
- The login controller regression uses an in-memory bcrypt fixture to verify normal password authentication and HttpOnly cookie issuance without touching the database or exposing credentials.
- The repository's reachable local history was sanitized before F8 resumed: `server/cookies.txt` is absent from rewritten local history, cookie jars and `.env` are ignored, and the reachable-history secret scan found no credible committed secret after remediation.
- The remote `origin/main` still contains the pre-remediation history. No push or force-push was performed; remote history repair remains a separately approved security operation.

### Automated and Live Verification

- Server `npm test`: 16 tests passed, 0 failed.
- Server syntax checks: all JavaScript files under `src` and `test` passed `node --check`.
- Client `npm run lint`: passed with no errors.
- Client `npm run build`: passed with Vite 8.3.0; 1,933 modules transformed.
- Client and server `npm ls --depth=0`: passed; dependency trees are satisfied. PDFKit remains server-only and no temporary/debug dependency was added.
- Public `GET /api/health`: 200. Unauthenticated `GET /api/auth/me`: 401. Exactly one process was listening on port 5002 during the final check.
- The live integration harness passed authentication/session errors, the complete backend role matrix, suppliers, KPIs, evaluations and immutable snapshots, comparison, Dashboard/Reports/CSV/PDF consistency, User Management response sanitization, and database invariance.
- Active KPI weights remained exactly 100 after verification.
- Admin, Procurement Manager, and Viewer received only their permitted API access. Admin-only KPI/User endpoints and manager-only write/evaluation configuration endpoints rejected unauthorized roles.
- Dashboard, evaluation history/result, comparison, report JSON, CSV, and PDF agreed on saved supplier, period, score, rating, and risk facts for the existing compatible evaluation pair.
- Reports and both exports respected supplier/year/quarter filters. CSV retained its existing content type and semantics; PDF retained its management-report format, snapshot-based KPI content, criteria grouping, empty-report behavior, and role access.
- Supplier, KPI, evaluation, report, comparison, and user validation/error contracts were exercised without creating valid permanent records. Invalid/malformed requests returned controlled 400/401/403/404/409 outcomes as applicable.
- User create/list/patch serialization tests confirmed `passwordHash` is absent while the model retains it for authentication.
- Multi-supplier, single-supplier, empty, and long-content PDFs were generated under the system temporary directory and inspected as rendered A4 pages. Page boundaries, wrapping, badges, charts, headers, footers, and page numbering were readable and no internal identifiers or session details were intentionally printed.
- The browser title, signed-out protected-route redirect, login labels/required errors, invalid-login message, and responsive login layout were checked at desktop, tablet, and mobile widths. No horizontal overflow or browser console errors were observed on that signed-out flow.
- The Dashboard Active suppliers card continues to use the same shared readable metric-card styling as Suppliers evaluated for every role; the responsive shared grid was unchanged.
- Package locks remain present, generated build output remains ignored, and no `.env`, cookie jar, generated PDF/export, `node_modules`, or temporary debug artifact is tracked.

### Database Safety

- The final live harness compared database counts and the complete KPI configuration before and after and reported them unchanged.
- No supplier, KPI, evaluation, or user was created, edited, archived, deleted, or reset during F8.
- The development database was not reset, and no fresh/final database was created or configured.

### Manual Follow-up / Non-blocking Limitations

- The exact pre-rotation session cookie was unavailable, so it could not be replayed; wrong-signature and expired-session rejection provide the executable replacement check.
- No valid account passwords are stored in the repository or environment, so fresh live credential login, authenticated browser refresh, already-authenticated login redirect, and full authenticated browser navigation require a short owner-run browser check. Password login behavior is covered by the new controller regression, and live post-rotation sessions were accepted for all roles.
- The current development database has no inactive user, so live inactive-account login/session rejection was not exercised without an unauthorized data mutation; the controller and middleware paths were verified through automated coverage and source/integration checks.
- The database has two, not three, compatible evaluations in a common period. Live comparison was verified with two suppliers; the three-supplier validation path is covered without manufacturing immutable data.
- The live database has no same-period incompatible comparison pair. `INCOMPATIBLE_CRITERIA` behavior is covered by the new service regression fixture.
- Full authenticated visual/responsive inspection of Dashboard, Suppliers, KPIs, Evaluations, Compare, Reports, and Users remains an owner browser pass because credentials were not exposed to the automated browser. The user previously manually verified F1 through F7 and the pre-F8 work.
- The 10,000-row CSV and 500-evaluation PDF limits were not exercised against the small development dataset; the implemented limits and related code paths were reviewed without generating bulk records.

### Release Readiness

The sanitized local application branch is ready for the separately controlled clean-database/final-initialization stage after the remaining manual browser checks and the separately approved remote-history repair. Nothing was pushed during F8.

## Final Database Initialization

Status: Completed

### Inspection Findings

- A read-only connection metadata check confirmed that the existing development URI has no explicit database path and currently resolves to the MongoDB default database named `test`.
- VendorPulse has four application models/collections: users, suppliers, KPIs, and evaluations.
- The existing `createInitialAdmin.js` script only created one Admin. It had no whole-database safety check, did not create the baseline KPIs, was not exposed as an npm script, and logged Admin identifiers.
- The repository already used `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in that legacy script, but the variables were not documented in `.env.example`.
- Runtime business logic does not hard-code default KPIs. Project progress documentation repeatedly identifies Quality 45%, Delivery 30%, and Cost 25% as the intended/restored baseline configuration, totaling exactly 100%.
- The proposed final target is a new explicit database named `vendorpulse` on the existing cluster. The current `test` development database remains untouched.

### Safe Initializer Implemented

- Replaced the narrow legacy Admin script with explicit `npm run db:init` initialization. Normal `npm start` and `npm run dev` do not invoke it.
- Requires an explicit database name in `MONGODB_URI`; a URI relying on MongoDB's default database is rejected before connection.
- Requires privately configured initial Admin name, email, and password values. Credentials, hashes, JWT values, and connection details are never logged.
- Accepts only a completely empty application database or the exact approved baseline. Exact-baseline reruns are no-ops; partial, different, or populated application states abort without changes.
- Creates exactly one active Admin and three active KPIs: Quality 45%, Delivery 30%, and Cost 25%.
- Never creates suppliers or evaluations and contains no drop, delete, reset, or overwrite operation.
- Uses a transaction and verifies the final record counts/configuration before commit, preventing a failed KPI step from leaving a partial Admin-only database.
- Disables Mongoose automatic collection/index creation during initializer preflight so an unexpected target receives no incidental schema writes before rejection.
- Reuses one shared bcrypt hashing helper for regular User creation and initialization while preserving the existing 12-round hashing behavior.

### Isolated Verification

- The initializer tests use an in-memory transactional repository fixture and never connect to MongoDB.
- Verified empty initialization, exactly one Admin, bcrypt password hashing, `passwordHash` serialization protection, exact baseline KPIs, 100% active weight, zero suppliers, and zero evaluations.
- Verified idempotent reruns, unexpected/partial database rejection, duplicate/missing KPI protection, invalid Admin hash rejection, rollback after simulated KPI persistence failure, required bootstrap validation, and explicit database-name validation.
- Full backend test suite passes: 22 tests, 0 failures.
- All server source and test files pass `node --check`.
- No Atlas database was initialized, reset, or otherwise modified during this preparation stage.

### Live Initialization and Compatibility Fix

- The owner approved `vendorpulse` and securely configured the explicit database path and initial Admin environment values without exposing them.
- Initial attempts failed safely and transaction rollback left `vendorpulse` at zero records. Safe error-location diagnostics identified that Mongoose requires `ordered: true` when creating multiple documents with a session.
- Added the required ordered transactional KPI creation option and retained sequential transaction reads. The temporary stack-location diagnostic was removed.
- The successful initializer run created exactly one active Admin, three active KPIs, zero suppliers, and zero evaluations.
- An immediate second initializer run recognized the exact approved baseline and completed as an idempotent no-op.
- Independent read-only verification confirmed Quality 45%, Delivery 30%, and Cost 25% are active, share the Admin creator, and total exactly 100%.

### Clean-Database Regression

- Restarted the backend with the final `vendorpulse` configuration; exactly one process listens on port 5002 and `GET /api/health` returns 200.
- Authenticated successfully as the initial Admin without logging credentials or the session cookie; `/api/auth/me` returned the active Admin session and no password hash.
- Dashboard returns zero active suppliers, zero evaluated suppliers, zero high/critical risk, zero-preserving rating categories, and no recent evaluations.
- Suppliers and evaluation history return paginated empty states.
- KPI Management returns only the three approved active KPIs totaling 100%.
- Evaluation configuration is valid, has a criteria signature and the baseline KPIs, and contains no eligible suppliers.
- Compare returns the controlled insufficient-supplier validation response rather than failing unexpectedly.
- Reports return an empty result set. CSV returns its valid header-only export, and PDF returns the designed valid empty report.
- User Management returns exactly the single active Admin and never serializes `passwordHash`.
- Logout succeeds and the subsequent session check returns 401.
- No dummy suppliers, evaluations, Procurement Managers, or Viewers were created.

### Development Database Preservation

- The old `test` database remains untouched with the same observed snapshot before and after clean-database regression: 4 users, 5 KPIs, 6 suppliers, and 4 evaluations.
- The old database was not dropped, cleared, renamed, or migrated.

### Final State

- `vendorpulse`: 1 user, 3 KPIs, 0 suppliers, 0 evaluations.
- `test`: retained as the development-data fallback pending a separate owner decision.
- Real environment values remain untracked and were not printed, staged, or committed.
