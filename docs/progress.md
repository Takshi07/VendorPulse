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
