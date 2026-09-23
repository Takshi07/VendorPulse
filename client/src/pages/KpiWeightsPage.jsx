import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { formatWeightTotal, isValidActiveTotal } from '../kpis/kpiUtils.js'
import './KpiPages.css'

function validateWeights(kpis, weights) {
  const errors = {}

  kpis.forEach((kpi) => {
    const value = weights[kpi._id]
    const numericWeight = Number(value)
    if (value === '' || !Number.isFinite(numericWeight)) {
      errors[kpi._id] = 'Enter a valid weight.'
    } else if (numericWeight <= 0 || numericWeight > 100) {
      errors[kpi._id] = 'Use a value greater than 0 and at most 100.'
    }
  })

  return errors
}

export default function KpiWeightsPage() {
  const navigate = useNavigate()
  const { restoreSession } = useAuth()
  const [kpis, setKpis] = useState(null)
  const [weights, setWeights] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadActiveKpis() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await api.get('/kpis', {
          query: { status: 'ACTIVE' },
          signal: controller.signal,
        })
        setKpis(response.kpis)
        setWeights(Object.fromEntries(response.kpis.map((kpi) => [kpi._id, String(kpi.weight)])))
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setLoadError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load active KPI weights. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadActiveKpis()
    return () => controller.abort()
  }, [requestVersion, restoreSession])

  const total = useMemo(
    () => Object.values(weights).reduce((sum, value) => {
      const numericWeight = Number(value)
      return sum + (Number.isFinite(numericWeight) ? numericWeight : 0)
    }, 0),
    [weights],
  )
  const totalIsValid = isValidActiveTotal(total)

  function handleWeightChange(kpiId, value) {
    setWeights((current) => ({ ...current, [kpiId]: value }))
    if (errors[kpiId]) setErrors((current) => ({ ...current, [kpiId]: undefined }))
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateWeights(kpis, weights)
    setErrors(validationErrors)
    setSubmitError('')

    if (Object.keys(validationErrors).length > 0) return
    if (!totalIsValid) {
      setSubmitError('Active KPI weights must total exactly 100%.')
      return
    }

    setSaving(true)
    try {
      const response = await api.put('/kpis/weights', {
        updates: kpis.map((kpi) => ({ id: kpi._id, weight: Number(weights[kpi._id]) })),
      })
      navigate('/kpis', {
        replace: true,
        state: { success: `KPI weights updated. Active total is ${formatWeightTotal(response.totalActiveWeight)}%.` },
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }
      setSubmitError(requestError instanceof ApiError
        ? requestError.message
        : 'Unable to update KPI weights. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container kpi-weights-page">
      <PageHeader
        title="Adjust KPI weights"
        description="Set the shared criteria used for new evaluations."
      />

      {loading ? <LoadingState label="Loading active KPI weights…" /> : null}
      {!loading && loadError ? (
        <ErrorState message={loadError} onRetry={() => setRequestVersion((version) => version + 1)} />
      ) : null}

      {!loading && !loadError && kpis?.length === 0 ? (
        <section className="surface kpi-weights-card">
          <EmptyState
            title="No active KPIs"
            message="Activate at least one KPI before adjusting the active weight total."
          />
          <Link className="text-link" to="/kpis">Return to KPI Management</Link>
        </section>
      ) : null}

      {!loading && !loadError && kpis?.length > 0 ? (
        <form className="surface kpi-weights-card" onSubmit={handleSubmit} noValidate>
          {submitError ? <div className="form-error kpi-weights__error" role="alert">{submitError}</div> : null}

          <div className="kpi-weight-table" role="table" aria-label="Active KPI weights">
            <div className="kpi-weight-table__header" role="row">
              <span role="columnheader">Criterion</span>
              <span role="columnheader">Weight (%)</span>
            </div>
            {kpis.map((kpi) => (
              <div className="kpi-weight-row" role="row" key={kpi._id}>
                <label htmlFor={`weight-${kpi._id}`} role="cell">{kpi.name}</label>
                <div className="kpi-weight-input" role="cell">
                  <input
                    id={`weight-${kpi._id}`}
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={weights[kpi._id] ?? ''}
                    onChange={(event) => handleWeightChange(kpi._id, event.target.value)}
                    aria-invalid={Boolean(errors[kpi._id])}
                    aria-describedby={errors[kpi._id] ? `weight-error-${kpi._id}` : undefined}
                  />
                  {errors[kpi._id] ? (
                    <span className="field-error" id={`weight-error-${kpi._id}`}>{errors[kpi._id]}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className={totalIsValid
            ? 'kpi-weight-summary kpi-weight-summary--inside'
            : 'kpi-weight-summary kpi-weight-summary--inside kpi-weight-summary--warning'}>
            Total weight: {formatWeightTotal(total)}% · {totalIsValid
              ? 'Ready for evaluation'
              : 'Active KPI weights must total exactly 100%'}
          </div>

          <p className="kpi-history-note">Existing evaluations retain their original names and weights.</p>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save weights'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
