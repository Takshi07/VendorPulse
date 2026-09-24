# VendorPulse

VendorPulse is a Level 3 MERN supplier performance management system. It provides authenticated, role-aware workflows for suppliers, KPIs, quarterly evaluations, comparison, reporting, CSV/PDF exports, and user administration.

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
4. Start the API with `npm run dev` from `server`.
5. Start Vite with `npm run dev` from `client`.

The API listens on port 5002. Vite listens on port 5173 and proxies relative `/api` requests to the API.

Required server environment variables:

```text
PORT=5002
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=
```

Use private deployment-specific values for `MONGODB_URI` and `JWT_SECRET`. Never commit `server/.env` or credentials.

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
