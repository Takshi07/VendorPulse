import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RatingBadge from '../components/RatingBadge.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import './DashboardPage.css'

const ratingOrder = [
  ['EXCELLENT', 'Excellent'],
  ['GOOD', 'Good'],
  ['NEEDS_IMPROVEMENT', 'Needs Improvement'],
  ['POOR', 'Poor'],
]

function currentPeriod() {
  const today = new Date()
  return {
    year: today.getFullYear(),
    quarter: Math.floor(today.getMonth() / 3) + 1,
  }
}

function buildPeriodOptions(count = 16) {
  const options = []
  const current = currentPeriod()

  for (let offset = 0; offset < count; offset += 1) {
    const quarterIndex = current.year * 4 + current.quarter - 1 - offset
    const year = Math.floor(quarterIndex / 4)
    const quarter = (quarterIndex % 4) + 1
    options.push({ year, quarter, value: `${year}-${quarter}` })
  }

  return options
}

function periodLabel({ year, quarter }) {
  return `Q${quarter} ${year}`
}

function SummaryCard({ featured = false, label, value, caption }) {
  return (
    <section className={`summary-card surface${featured ? ' summary-card--featured' : ''}`}>
      <div className="summary-card__top">
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <span className="summary-card__caption">{caption}</span>
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading dashboard</span>
      <div className="dashboard-skeleton__metrics">
        {[0, 1, 2].map((item) => <div className="skeleton-block surface" key={item} />)}
      </div>
      <div className="skeleton-block skeleton-block--panel surface" />
      <div className="skeleton-block skeleton-block--table surface" />
    </div>
  )
}

export default function DashboardPage() {
  const { restoreSession } = useAuth()
  const [period, setPeriod] = useState(currentPeriod)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const periodOptions = useMemo(() => buildPeriodOptions(), [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/dashboard', {
          query: period,
          signal: controller.signal,
        })

        setDashboard(response)
      } catch (requestError) {
        if (controller.signal.aborted) return

        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }

        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Unable to load the dashboard. Check your connection and try again.',
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [period, requestVersion, restoreSession])

  function handlePeriodChange(event) {
    const [year, quarter] = event.target.value.split('-').map(Number)
    setPeriod({ year, quarter })
  }

  const selectedPeriodLabel = periodLabel(period)
  const displayedPeriodLabel = dashboard ? periodLabel(dashboard.period) : selectedPeriodLabel

  return (
    <div className="page-container dashboard-page">
      <PageHeader
        title="Performance overview"
        description="A clearer view of your supplier network."
        actions={(
          <label className="period-control">
            <span>Reporting period</span>
            <select
              value={`${period.year}-${period.quarter}`}
              onChange={handlePeriodChange}
              disabled={loading}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>{periodLabel(option)}</option>
              ))}
            </select>
          </label>
        )}
      />

      {loading && !dashboard ? <DashboardSkeleton /> : null}

      {error && !dashboard ? (
        <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
      ) : null}

      {dashboard ? (
        <div className={loading ? 'dashboard-content is-refreshing' : 'dashboard-content'}>
          {error ? (
            <div className="dashboard-inline-error" role="alert">
              <span>
                Could not load {selectedPeriodLabel}. {error} Showing {displayedPeriodLabel}.
              </span>
              <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>Try again</button>
            </div>
          ) : null}

          <div className="summary-grid">
            <SummaryCard
              featured
              label="Active suppliers"
              value={dashboard.metrics.activeSupplierCount}
              caption="Current supplier records"
            />
            <SummaryCard
              label="Suppliers evaluated"
              value={dashboard.metrics.evaluatedSupplierCount}
              caption="Selected reporting period"
            />
            <SummaryCard
              label="High / critical risk"
              value={dashboard.metrics.highCriticalCount}
              caption="Selected reporting period"
            />
          </div>

          <section className="surface dashboard-panel ratings-panel">
            <div className="dashboard-panel__heading">
              <h2>Performance ratings</h2>
              <p>Number of evaluated suppliers · {displayedPeriodLabel}</p>
            </div>
            <div className="rating-list">
              {ratingOrder.map(([key, label]) => {
                const count = dashboard.ratingDistribution[key] ?? 0
                const denominator = Math.max(
                  dashboard.metrics.activeSupplierCount,
                  dashboard.metrics.evaluatedSupplierCount,
                  1,
                )
                const width = Math.min((count / denominator) * 100, 100)

                return (
                  <div className="rating-row" key={key}>
                    <span>{label}</span>
                    <div
                      className="rating-track"
                      role="progressbar"
                      aria-label={`${label}: ${count}`}
                      aria-valuemin="0"
                      aria-valuemax={denominator}
                      aria-valuenow={count}
                    >
                      <span className="rating-bar" style={{ width: `${width}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="surface dashboard-panel recent-panel">
            <div className="dashboard-panel__heading">
              <h2>Recent evaluations</h2>
            </div>

            {dashboard.recentEvaluations.length === 0 ? (
              <EmptyState
                title="No evaluations for this period"
                message={`Submitted evaluations for ${displayedPeriodLabel} will appear here.`}
              />
            ) : (
              <div className="table-scroll">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Score / 5</th>
                      <th>Rating</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentEvaluations.map((evaluation) => (
                      <tr key={evaluation._id}>
                        <td>
                          <Link to={`/evaluations/${evaluation._id}`}>
                            {evaluation.supplierId?.supplierName || 'Unavailable supplier'}
                          </Link>
                        </td>
                        <td>{Number(evaluation.overallScore).toFixed(2)}</td>
                        <td><RatingBadge rating={evaluation.performanceRating} /></td>
                        <td><RiskBadge risk={evaluation.riskLevel} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
