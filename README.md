# VendorPulse

VendorPulse is a MERN supplier performance management system. It provides authenticated, role-aware workflows for suppliers, KPIs, quarterly evaluations, comparison, reporting, CSV/PDF exports, and user administration.

## Stack

- React 19 and Vite
- React Router
- Express 5 and Node.js
- MongoDB with Mongoose
- HttpOnly JWT session cookies
- PDFKit for server-generated management reports

## Roles

| Capability | Admin | Procurement Manager | Viewer |
| --- | --- | --- | --- |
| Dashboard, supplier information, evaluation results, comparison, reports, CSV/PDF | Yes | Yes | Yes |
| Create/edit/archive suppliers and submit evaluations | Yes | Yes | No |
| KPI management and coordinated weights | Yes | No | No |
| User management | Yes | No | No |

Frontend controls are role-aware, and the backend independently enforces the same permissions.

## Local setup

Requirements: a supported Node.js installation and access to a MongoDB database.

1. Install server dependencies with `npm install` from `server`.
2. Install client dependencies with `npm install` from `client`.
3. Copy `server/.env.example` to `server/.env` and set the private values locally.
4. For a brand-new database only, review and run the explicit initialization command described below.
5. Start the API with `npm run dev` from `server`.
6. Start Vite with `npm run dev` from `client`.

The API listens on port 5002. Vite listens on port 5173 and proxies relative `/api` requests to the API.

Required server environment variables:

```text
PORT=5002
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=
INITIAL_ADMIN_NAME=
INITIAL_ADMIN_EMAIL=
INITIAL_ADMIN_PASSWORD=
DEMO_MANAGER_PASSWORD=
DEMO_VIEWER_PASSWORD=
```

Use private deployment-specific values for `MONGODB_URI`, `JWT_SECRET`, and the initial Admin credentials. Never commit `server/.env` or credentials. For initialization, `MONGODB_URI` must include one explicit database name rather than relying on MongoDB's default database.

## Fresh database initialization

Database initialization is an explicit one-time operation and is never run by normal server startup:

```bash
cd server
npm run db:init
```

Before running it, configure `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` privately. The initializer validates the target before writing and permits only:

- A completely empty VendorPulse database, which receives one active Admin plus Quality 45%, Delivery 30%, and Cost 25% as active KPIs.
- The exact same approved baseline, in which case rerunning is a no-op.

It aborts on partial or unexpected application data and never drops collections, deletes records, creates suppliers, or creates evaluations. Creation is transactional so a failed KPI step cannot leave a partial Admin-only installation. Bootstrap credentials are used only for initial creation; rerunning does not rotate an existing Admin password.

After successful initialization, start the API normally and sign in with the privately configured initial Admin credentials. Additional users and all suppliers are then created through the authenticated application.

## Optional demo dataset

The professional review dataset is a separate, explicit operation and is never
run by `npm start`, `npm run dev`, or `npm run db:init`. It accepts only an exact
`vendorpulse` baseline (one active Admin, the 45/30/25 KPI configuration, and no
supplier or evaluation records) or the exact completed demo dataset.

Set `DEMO_MANAGER_PASSWORD` and `DEMO_VIEWER_PASSWORD` privately, review the
records in `server/src/services/demoDataService.js`, then run:

```bash
cd server
npm run db:seed-demo
```

The operation preserves the initial Admin, runs in a transaction, aborts on
partial or unexpected data, and is an idempotent no-op when the approved demo
dataset already exists. It refuses `test` and every database name other than
the exact name `vendorpulse`.

## Application behavior

Authentication uses an eight-hour JWT stored only in the HttpOnly `vp_session` cookie. The client restores a session through `GET /api/auth/me` and never stores the token in browser storage.

Submitted evaluations are immutable. Each result stores KPI names and weights as `kpiNameSnapshot` and `weightSnapshot`, together with its saved scores, rating, risk, and criteria signature. Historical views and exports use these snapshots rather than current KPI definitions. Supplier comparison requires compatible criteria; PDF KPI summaries group historical evaluations by compatible criteria configuration.

Reports provide two intentionally different exports:

- CSV is the raw, filterable evaluation data export.
- PDF is an A4 management report with summaries, distributions, snapshot-based KPI analysis, and detailed evaluation sections.

Both exports use the Reports page's supplier, year, and quarter filters.

## Verification commands

```bash
cd server
npm test

cd ../client
npm run lint
npm run build
```

See [API documentation](docs/api.md), [data model documentation](docs/data-model.md), and [implementation progress](docs/progress.md) for further detail.

VendorPulse has not been documented here as a deployed service; these instructions describe local development and verification.
