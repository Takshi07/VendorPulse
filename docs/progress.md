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
