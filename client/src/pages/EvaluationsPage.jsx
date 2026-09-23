import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Pagination from '../components/Pagination.jsx'
import { formatEnum, periodLabel } from '../evaluations/evaluationUtils.js'
import { canManageSuppliers } from '../suppliers/supplierUtils.js'
import './EvaluationPages.css'

const PAGE_SIZE = 10

async function loadAllSuppliers(signal) {
  const firstPage = await api.get('/suppliers', { query: { page: 1, limit: 100 }, signal })
  if (firstPage.pagination.totalPages <= 1) return firstPage.suppliers

  const remaining = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) => (
      api.get('/suppliers', { query: { page: index + 2, limit: 100 }, signal })
    )),
  )
  return [firstPage, ...remaining].flatMap((response) => response.suppliers)
}

function EvaluationListSkeleton() {
  return (
    <div className="evaluation-table-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading evaluations</span>
      {[0, 1, 2, 3].map((row) => <span key={row} />)}
    </div>
  )
}

export default function EvaluationsPage() {
  const location = useLocation()
  const { user, restoreSession } = useAuth()
  const [filterValues, setFilterValues] = useState({ supplierId: '', year: '', quarter: '' })
  const [filters, setFilters] = useState({ supplierId: '', year: '', quarter: '' })
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [notice, setNotice] = useState(location.state?.success || '')

  useEffect(() => {
    const controller = new AbortController()

    async function loadEvaluations() {
      setLoading(true)
      setError('')
      try {
        const [evaluationResponse, supplierResponse] = await Promise.all([
          api.get('/evaluations', {
            query: { page, limit: PAGE_SIZE, ...filters },
            signal: controller.signal,
          }),
          loadAllSuppliers(controller.signal),
        ])
        setData(evaluationResponse)
        setSuppliers(supplierResponse.sort((a, b) => a.supplierName.localeCompare(b.supplierName)))
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load evaluations. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadEvaluations()
    return () => controller.abort()
  }, [filters, page, requestVersion, restoreSession])

  function applyFilters(event) {
    event.preventDefault()
    setFilters(filterValues)
    setPage(1)
  }

  function clearFilters() {
    const cleared = { supplierId: '', year: '', quarter: '' }
    setFilterValues(cleared)
    setFilters(cleared)
    setPage(1)
  }

  const hasFilters = Boolean(filters.supplierId || filters.year || filters.quarter)

  return (
    <div className="page-container evaluation-list-page">
      <PageHeader
        title="Evaluations"
        description="Quarterly supplier assessments and their results."
        actions={canManageSuppliers(user.role) ? (
          <Link className="button button--primary" to="/evaluations/new">
            <Plus aria-hidden="true" /> New evaluation
          </Link>
        ) : null}
      />

      {notice ? (
        <div className="evaluation-success-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">Dismiss</button>
        </div>
      ) : null}

      <section className="surface evaluation-list-card">
        <form className="evaluation-filters" onSubmit={applyFilters}>
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
              {[1, 2, 3, 4].map((quarter) => <option value={quarter} key={quarter}>Q{quarter}</option>)}
            </select>
          </label>
          <div className="evaluation-filter-actions">
            <button className="button button--primary" type="submit">Apply</button>
            {hasFilters ? <button className="button button--secondary" type="button" onClick={clearFilters}>Clear</button> : null}
          </div>
        </form>

        {loading && !data ? <EvaluationListSkeleton /> : null}
        {error && !data ? (
          <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
        ) : null}

        {data ? (
          <div className={loading ? 'evaluation-results is-refreshing' : 'evaluation-results'}>
            {error ? (
              <div className="evaluation-inline-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>Try again</button>
              </div>
            ) : null}

            {data.evaluations.length === 0 ? (
              <EmptyState
                title={hasFilters ? 'No evaluations match these filters' : 'No evaluations yet'}
                message={hasFilters
                  ? 'Try a different supplier, year, or quarter.'
                  : 'Submitted supplier evaluations will appear here.'}
              />
            ) : (
              <div className="table-scroll">
                <table className="evaluation-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Period</th>
                      <th>Score / 5</th>
                      <th>Rating</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.evaluations.map((evaluation) => (
                      <tr key={evaluation._id}>
                        <td>{evaluation.supplierId?.supplierName || 'Unavailable supplier'}</td>
                        <td>{periodLabel(evaluation.year, evaluation.quarter)}</td>
                        <td>{Number(evaluation.overallScore).toFixed(2)}</td>
                        <td>
                          <span className={evaluation.performanceRating === 'EXCELLENT'
                            ? 'status-chip status-chip--success'
                            : ''}>
                            {formatEnum(evaluation.performanceRating)}
                          </span>
                        </td>
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
