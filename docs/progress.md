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
