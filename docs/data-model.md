# VendorPulse Data Model

VendorPulse uses four Mongoose models and their standard pluralized MongoDB collections.

| Model | Collection | Purpose |
| --- | --- | --- |
| `User` | `users` | Authenticated users, roles, status, and the private password hash |
| `Supplier` | `suppliers` | Active and archived supplier records |
| `KPI` | `kpis` | Current evaluation criteria, weights, and status |
| `Evaluation` | `evaluations` | Immutable quarterly supplier evaluation results and KPI snapshots |

## User

Users have a name, normalized unique email, bcrypt password hash, role, status, and timestamps. Roles are Admin, Procurement Manager, and Viewer. The password hash is excluded from queries by default and removed by JSON serialization.

## Supplier

Suppliers require a name, category, creator, and active/archive status. Contact, address, tax ID, and contract dates are optional. Archiving preserves historical records; suppliers are not hard-deleted by the application.

## KPI

KPIs require a unique name, weight greater than 0 and at most 100, active/inactive status, creator, and timestamps. The active configuration must contain at least one KPI and total exactly 100% before evaluation submission.

The approved fresh-installation baseline is:

- Quality — 45% — Active
- Delivery — 30% — Active
- Cost — 25% — Active

## Evaluation

Evaluations are unique per supplier, year, and quarter. Each submitted result stores:

- Supplier and evaluator references.
- Year, quarter, and criteria signature.
- One integer score from 1 through 5 for every active KPI.
- Immutable `kpiNameSnapshot` and `weightSnapshot` values.
- Optional KPI and overall comments.
- The backend-calculated overall score, performance rating, and risk level.

Historical evaluation output always uses saved snapshots rather than current KPI definitions. Comparison requires compatible criteria signatures, while PDF portfolio KPI summaries group records by compatible criteria configuration.

## Fresh installation boundary

The explicit database initializer permits only a completely empty application database or the exact approved baseline. A newly initialized database contains exactly one active Admin and the three baseline KPIs. It contains no suppliers and no evaluations. Any partial or unexpected application data causes initialization to abort without deleting or overwriting records.
