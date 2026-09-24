# VendorPulse API

The Express API listens on port 5002 in local development. The Vite client uses relative `/api` URLs and sends credentials with requests.

## Authentication and errors

- Authentication uses the HttpOnly `vp_session` cookie. JWT values are never returned as JSON or stored by the client.
- `GET /api/health` is public. Application endpoints require an active authenticated user unless noted otherwise.
- Standard status semantics are: `400` invalid input, `401` missing/invalid session, `403` insufficient role or inactive access, `404` missing resource, and `409` conflict.
- Validation and known conflicts return controlled JSON messages. Unexpected failures return a generic server error rather than internal stack or database details.

Roles are `ADMIN`, `PROCUREMENT_MANAGER`, and `VIEWER`.

## Endpoint overview

### Health and session

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API health check |
| `POST` | `/api/auth/login` | Public | Validate email/password and issue an HttpOnly session |
| `GET` | `/api/auth/me` | Authenticated | Restore the current active user session |
| `POST` | `/api/auth/logout` | Public | Clear the session cookie |

### Suppliers

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/suppliers` | All roles | Paginated supplier list with supported search/status/category filters |
| `GET` | `/api/suppliers/:id` | All roles | Supplier details and historical evaluations |
| `POST` | `/api/suppliers` | Admin, Procurement Manager | Create a supplier |
| `PATCH` | `/api/suppliers/:id` | Admin, Procurement Manager | Update supported supplier fields |
| `PATCH` | `/api/suppliers/:id/archive` | Admin, Procurement Manager | Archive without deleting historical data |

Archived suppliers remain available for history but cannot receive new evaluations.

### KPIs

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/kpis` | Admin | List KPIs |
| `GET` | `/api/kpis/:id` | Admin | Get one KPI |
| `POST` | `/api/kpis` | Admin | Create a KPI |
| `PATCH` | `/api/kpis/:id` | Admin | Edit supported fields/status |
| `PUT` | `/api/kpis/weights` | Admin | Apply coordinated active KPI weights |

KPI names are unique, individual weights must be greater than 0 and at most 100, and active weights must total exactly 100 before evaluations can be submitted.

### Evaluations

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/evaluation-config` | Admin, Procurement Manager | Active suppliers/KPIs and current criteria signature |
| `POST` | `/api/evaluations` | Admin, Procurement Manager | Submit one immutable supplier-period evaluation |
| `GET` | `/api/evaluations` | All roles | Paginated evaluation history with supported filters |
| `GET` | `/api/evaluations/:id` | All roles | Saved evaluation result and KPI snapshots |

Every active KPI requires one integer score from 1 through 5. The backend calculates the authoritative overall score, rating, and risk. Duplicate supplier/year/quarter submissions return `409`; a stale signature returns `409` with code `CRITERIA_CHANGED`.

Submitted results are read-only. Historical KPI names and weights come from `kpiNameSnapshot` and `weightSnapshot`, never from current KPI definitions.

### Dashboard and comparison

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard` | All roles | Period summary, distributions, and recent evaluations |
| `GET` | `/api/comparisons` | All roles | Compare exactly two or three distinct suppliers in one period |

Comparison accepts the supported supplier ID collection, year, and quarter query parameters. Missing evaluations return `MISSING_EVALUATION`; incompatible saved criteria return `INCOMPATIBLE_CRITERIA`. The service does not manufacture missing results or choose arbitrary winners.

### Reports and exports

All report endpoints allow Admin, Procurement Manager, and Viewer. Supported report filters are `supplierId`, `year`, and `quarter`; the paginated JSON endpoint additionally accepts `page` and `limit` (capped at 100).

| Method | Path | Output | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/reports/evaluations` | JSON | Paginated report table data |
| `GET` | `/api/reports/evaluations.csv` | `text/csv` | Raw evaluation rows for analysis |
| `GET` | `/api/reports/evaluations.pdf` | `application/pdf` | A4 management-facing performance report |

CSV preserves its existing columns and has a 10,000-row export limit. PDF exports are generated in memory, use a safe scope-based filename, set `Cache-Control: no-store`, and have a 500-evaluation limit.

PDF summaries use only filtered saved evaluations. KPI aggregation is grouped by compatible criteria signatures, while signatures and internal IDs are not printed. An empty scope produces a clean one-page report with the selected scope and no misleading zero-performance charts. A one-evaluation scope uses an individual summary rather than a comparison chart.

### Users

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users` | Admin | Paginated/searchable/filterable user list |
| `POST` | `/api/users` | Admin | Create a user with a supported role |
| `PATCH` | `/api/users/:id` | Admin | Update supported profile, role, and status fields |

Admin protection rules are enforced server-side. Passwords are hashed before persistence, and `passwordHash` is excluded from create, list, patch, and JSON serialization responses.

## Security and data boundaries

- Helmet is enabled and JSON request bodies are limited to 1 MB.
- Protected routes load the current user from the verified session and reject inactive accounts.
- Role authorization is enforced on the server independently of frontend navigation.
- Generated reports do not expose credentials, session values, password hashes, raw criteria signatures, or internal database identifiers.
- Generated PDF files are streamed from memory and are not written permanently to the server filesystem.
