# Reports API

All report endpoints require the existing `vp_session` HttpOnly authentication cookie. Access is permitted to `ADMIN`, `PROCUREMENT_MANAGER`, and `VIEWER` users.

## Evaluation report data

`GET /api/reports/evaluations`

Returns paginated submitted evaluations for the report table. Supported query parameters are:

- `supplierId` — optional supplier ObjectId.
- `year` — optional integer reporting year.
- `quarter` — optional integer from 1 through 4.
- `page` — optional page number.
- `limit` — optional page size, capped at 100.

## CSV data export

`GET /api/reports/evaluations.csv`

Exports the raw evaluation rows for further analysis. It accepts `supplierId`, `year`, and `quarter` and retains the existing CSV columns and 10,000-row export limit.

## PDF performance report

`GET /api/reports/evaluations.pdf`

Exports a management-facing A4 PDF generated from the same filtered evaluation records as the report table and CSV export. It accepts the same `supplierId`, `year`, and `quarter` filters.

The response uses `Content-Type: application/pdf`, `Content-Disposition: attachment`, a scope-based safe filename, and `Cache-Control: no-store`. PDFs are generated in memory and are not saved to the server filesystem. PDF exports are limited to 500 evaluations; larger scopes return a 400 response requesting narrower filters.

The PDF includes:

- Reporting scope and a UTC generated timestamp.
- Evaluation, supplier, average-score, and high/critical-risk summaries.
- Human-readable performance-rating and risk distributions.
- Overall supplier score bars for multi-evaluation reports.
- KPI analysis derived only from saved `kpiNameSnapshot`, `weightSnapshot`, and saved KPI scores.
- Structured detailed evaluation results, evaluator name, submitted timestamp, and comments when present.

KPI portfolio summaries are grouped by compatible `criteriaSignature` values and shown with human-readable configuration labels. Raw signatures and internal MongoDB identifiers are not printed. When no evaluations match, the endpoint returns a clean one-page report without zero-performance cards or empty charts. A one-evaluation scope uses an individual summary instead of a supplier-comparison chart.
