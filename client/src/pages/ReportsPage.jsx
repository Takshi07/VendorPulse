import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Pagination from '../components/Pagination.jsx'
import RatingBadge from '../components/RatingBadge.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import { currentPeriod, periodLabel } from '../evaluations/evaluationUtils.js'
import { loadAllSuppliers } from '../suppliers/supplierApi.js'
import './CompareReports.css'

const PAGE_SIZE = 10

function ReportSkeleton() {
  return (
    <div className="report-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading report</span>
      {[0, 1, 2, 3].map((row) => <span key={row} />)}
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'Unavailable'
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(value))
}

export default function ReportsPage() {
  const { restoreSession } = useAuth()
  const [initialFilters] = useState(() => ({ supplierId: '', ...currentPeriod() }))
  const [filterValues, setFilterValues] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportNotice, setExportNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadReport() {
      setLoading(true)
      setError('')
      try {
        const [reportResponse, supplierResponse] = await Promise.all([
          api.get('/reports/evaluations', {
            query: { page, limit: PAGE_SIZE, ...filters },
            signal: controller.signal,
          }),
          loadAllSuppliers(controller.signal),
        ])
        setData(reportResponse)
        setSuppliers(supplierResponse)
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load the report. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadReport()
    return () => controller.abort()
  }, [filters, page, requestVersion, restoreSession])

  function applyFilters(event) {
    event.preventDefault()
    setFilters(filterValues)
    setPage(1)
    setExportError('')
    setExportNotice('')
  }

  function clearFilters() {
    const cleared = { supplierId: '', year: '', quarter: '' }
    setFilterValues(cleared)
    setFilters(cleared)
    setPage(1)
    setExportError('')
    setExportNotice('')
  }

  async function exportCsv() {
    setExporting(true)
    setExportError('')
    setExportNotice('')
    try {
      const result = await api.download('/reports/evaluations.csv', {
        query: filters,
        filename: 'vendorpulse-evaluations.csv',
      })
      setExportNotice(`${result.filename} downloaded using the active filters.`)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }
      setExportError(requestError instanceof ApiError
        ? requestError.message
        : 'Unable to export the report. Check your connection and try again.')
    } finally {
      setExporting(false)
    }
  }

  const hasFilters = Boolean(filters.supplierId || filters.year || filters.quarter)

  return (
    <div className="page-container reports-page">
      <PageHeader
        title="Evaluation reports"
        description="Filter submitted evaluation records and export the selected results."
        actions={(
          <button className="button button--primary" type="button" onClick={exportCsv} disabled={exporting || !data}>
            <Download aria-hidden="true" /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        )}
      />

      {exportNotice ? <div className="report-export-notice" role="status">{exportNotice}</div> : null}
      {exportError ? <div className="report-export-error" role="alert">{exportError}</div> : null}

      <section className="surface reports-card">
        <form className="report-filters" onSubmit={applyFilters}>
          <label className="field">
            <span>Supplier</span>
            <select
              value={filterValues.supplierId}
              onChange={(event) => setFilterValues((current) => ({ ...current, supplierId: event.target.value }))}
            >
              <option value="">All suppliers</option>
              {suppliers.map((supplier) => (
                <option value={supplier._id} key={supplier._id}>
                  {supplier.supplierName}{supplier.status === 'ARCHIVED' ? ' (Archived)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Year</span>
            <input
              type="number"
              step="1"
              value={filterValues.year}
              onChange={(event) => setFilterValues((current) => ({ ...current, year: event.target.value }))}
              placeholder="All years"
            />
          </label>
          <label className="field">
            <span>Quarter</span>
            <select
              value={filterValues.quarter}
              onChange={(event) => setFilterValues((current) => ({ ...current, quarter: event.target.value }))}
            >
              <option value="">All quarters</option>
              {[1, 2, 3, 4].map((value) => <option value={value} key={value}>Q{value}</option>)}
            </select>
          </label>
          <div className="report-filter-actions">
            <button className="button button--primary" type="submit">Apply</button>
            {hasFilters ? <button className="button button--secondary" type="button" onClick={clearFilters}>Clear</button> : null}
          </div>
        </form>

        {loading && !data ? <ReportSkeleton /> : null}
        {error && !data ? (
          <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
        ) : null}

        {data ? (
          <div className={loading ? 'report-results is-refreshing' : 'report-results'}>
            {error ? (
              <div className="report-inline-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>Try again</button>
              </div>
            ) : null}

            {data.evaluations.length === 0 ? (
              <EmptyState
                title={hasFilters ? 'No evaluations match these filters' : 'No evaluation records yet'}
                message={hasFilters
                  ? 'Try a different supplier, year, or quarter.'
                  : 'Submitted supplier evaluations will appear here.'}
              />
            ) : (
              <div className="table-scroll">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Period</th>
                      <th>Score / 5</th>
                      <th>Rating</th>
                      <th>Risk</th>
                      <th>Evaluator</th>
                      <th>Submitted</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.evaluations.map((evaluation) => (
                      <tr key={evaluation._id}>
                        <td>
                          <strong>{evaluation.supplierId?.supplierName || 'Unavailable supplier'}</strong>
                          <small>{evaluation.supplierId?.category || 'No category'}</small>
                        </td>
                        <td>{periodLabel(evaluation.year, evaluation.quarter)}</td>
                        <td>{Number(evaluation.overallScore).toFixed(2)}</td>
                        <td><RatingBadge rating={evaluation.performanceRating} /></td>
                        <td><RiskBadge risk={evaluation.riskLevel} /></td>
                        <td>{evaluation.evaluatorId?.name || 'Unavailable'}</td>
                        <td>{formatDate(evaluation.createdAt)}</td>
                        <td><Link className="table-action" to={`/evaluations/${evaluation._id}`}>View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              label="evaluations"
              onChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
