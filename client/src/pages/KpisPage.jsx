import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import {
  formatWeight,
  getActiveWeightTotal,
  isValidActiveTotal,
} from '../kpis/kpiUtils.js'
import './KpiPages.css'

function KpiListSkeleton() {
  return (
    <div className="kpi-table-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading KPIs</span>
      {[0, 1, 2, 3].map((row) => <span key={row} />)}
    </div>
  )
}

export default function KpisPage() {
  const location = useLocation()
  const { restoreSession } = useAuth()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [notice, setNotice] = useState(location.state?.success || '')

  useEffect(() => {
    const controller = new AbortController()

    async function loadKpis() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/kpis', { signal: controller.signal })
        setKpis(response.kpis)
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load KPI criteria. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadKpis()
    return () => controller.abort()
  }, [requestVersion, restoreSession])

  const total = getActiveWeightTotal(kpis || [])
  const totalIsValid = isValidActiveTotal(total)

  return (
    <div className="page-container kpi-list-page">
      <PageHeader
        title="KPI Management"
        description="Manage the criteria used to assess supplier performance."
        actions={(
          <div className="page-actions">
            <Link className="button button--secondary" to="/kpis/weights">Adjust weights</Link>
            <Link className="button button--primary" to="/kpis/new">
              <Plus aria-hidden="true" /> Add KPI
            </Link>
          </div>
        )}
      />

      {notice ? (
        <div className="kpi-success-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">Dismiss</button>
        </div>
      ) : null}

      {kpis ? (
        <div className={totalIsValid ? 'kpi-weight-summary' : 'kpi-weight-summary kpi-weight-summary--warning'}>
          Active weight total: {formatWeight(total)}% · {totalIsValid
            ? 'Changes apply to future evaluations.'
            : 'Adjust active weights to exactly 100% before submitting evaluations.'}
        </div>
      ) : null}

      <section className="surface kpi-list-card">
        {loading && !kpis ? <KpiListSkeleton /> : null}
        {error && !kpis ? (
          <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
        ) : null}

        {kpis ? (
          <div className={loading ? 'kpi-results is-refreshing' : 'kpi-results'}>
            {error ? (
              <div className="kpi-inline-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>Try again</button>
              </div>
            ) : null}

            {kpis.length === 0 ? (
              <EmptyState
                title="No KPI criteria yet"
                message="Add a KPI to define how future supplier evaluations will be scored."
              />
            ) : (
              <div className="table-scroll">
                <table className="kpi-table">
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>Weight</th>
                      <th>Status</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((kpi) => (
                      <tr key={kpi._id}>
                        <td>{kpi.name}</td>
                        <td>{formatWeight(kpi.weight)}%</td>
                        <td>
                          <span className={kpi.status === 'ACTIVE'
                            ? 'status-chip status-chip--success'
                            : 'status-chip status-chip--neutral'}>
                            {kpi.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td><Link className="table-action" to={`/kpis/${kpi._id}/edit`}>Edit</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}
