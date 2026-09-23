import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { ErrorState, LoadingState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import {
  calculateWeightedPreview,
  emptyEvaluationDraft,
  formatEnum,
  previewClassification,
  reconcileDraft,
  validateEvaluationDraft,
} from '../evaluations/evaluationUtils.js'
import './EvaluationPages.css'

export default function EvaluationFormPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { restoreSession } = useAuth()
  const [config, setConfig] = useState(location.state?.refreshedConfig || null)
  const [draft, setDraft] = useState(() => {
    const initialDraft = location.state?.draft || emptyEvaluationDraft(searchParams.get('supplierId') || '')
    return location.state?.refreshedConfig
      ? reconcileDraft(initialDraft, location.state.refreshedConfig)
      : initialDraft
  })
  const [errors, setErrors] = useState({ scores: {}, kpiComments: {} })
  const [loading, setLoading] = useState(!location.state?.refreshedConfig)
  const [loadError, setLoadError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const criteriaNotice = location.state?.criteriaChanged

  useEffect(() => {
    if (location.state?.refreshedConfig) return undefined

    const controller = new AbortController()

    async function loadConfig() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await api.get('/evaluation-config', { signal: controller.signal })
        setConfig(response)
        setDraft((current) => reconcileDraft(current, response))
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setLoadError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load the evaluation criteria. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadConfig()
    return () => controller.abort()
  }, [location.state?.refreshedConfig, requestVersion, restoreSession])

  function updateDraft(name, value) {
    setDraft((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function updateScore(kpiId, value) {
    setDraft((current) => ({ ...current, scores: { ...current.scores, [kpiId]: value } }))
    if (errors.scores?.[kpiId]) {
      setErrors((current) => ({
        ...current,
        scores: { ...current.scores, [kpiId]: undefined },
      }))
    }
  }

  function updateKpiComment(kpiId, value) {
    setDraft((current) => ({
      ...current,
      kpiComments: { ...current.kpiComments, [kpiId]: value },
    }))
    if (errors.kpiComments?.[kpiId]) {
      setErrors((current) => ({
        ...current,
        kpiComments: { ...current.kpiComments, [kpiId]: undefined },
      }))
    }
  }

  function handleReview(event) {
    event.preventDefault()
    if (!config?.valid) return
    const validation = validateEvaluationDraft(draft, config)
    setErrors(validation.errors)
    if (validation.hasErrors) return

    navigate('/evaluations/review', {
      state: {
        draft: { ...draft, criteriaSignature: config.criteriaSignature },
        config,
      },
    })
  }

  const previewScore = config ? calculateWeightedPreview(config.kpis, draft.scores) : null
  const preview = previewClassification(previewScore)

  return (
    <div className="page-container evaluation-form-page">
      <PageHeader
        title="Evaluate supplier"
        description="Score each KPI from 1 to 5. Submitted results are read-only."
        actions={<Link className="button button--secondary" to="/evaluations">Cancel</Link>}
      />

      {loading ? <LoadingState label="Loading evaluation criteria…" /> : null}
      {!loading && loadError ? (
        <ErrorState message={loadError} onRetry={() => setRequestVersion((version) => version + 1)} />
      ) : null}

      {!loading && !loadError && config ? (
        <form className="surface evaluation-form" onSubmit={handleReview} noValidate>
          {criteriaNotice ? (
            <div className="evaluation-warning-banner" role="alert">
              Evaluation criteria changed. Scores and comments for unchanged KPIs were preserved. Review the updated criteria before continuing.
            </div>
          ) : null}

          {!config.valid ? (
            <div className="evaluation-warning-banner" role="alert">
              {config.message || 'Active KPI weights must total exactly 100% before an evaluation can be submitted.'}
            </div>
          ) : null}

          <div className="evaluation-period-grid">
            <label className="field">
              <span>Supplier</span>
              <select
                value={draft.supplierId}
                onChange={(event) => updateDraft('supplierId', event.target.value)}
                aria-invalid={Boolean(errors.supplierId)}
              >
                <option value="">Select supplier</option>
                {config.suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>{supplier.supplierName}</option>
                ))}
              </select>
              {errors.supplierId ? <span className="field-error">{errors.supplierId}</span> : null}
            </label>
            <label className="field">
              <span>Quarter</span>
              <select
                value={draft.quarter}
                onChange={(event) => updateDraft('quarter', event.target.value)}
                aria-invalid={Boolean(errors.quarter)}
              >
                {[1, 2, 3, 4].map((quarter) => <option key={quarter} value={quarter}>Q{quarter}</option>)}
              </select>
              {errors.quarter ? <span className="field-error">{errors.quarter}</span> : null}
            </label>
            <label className="field">
              <span>Year</span>
              <input
                type="number"
                step="1"
                value={draft.year}
                onChange={(event) => updateDraft('year', event.target.value)}
                aria-invalid={Boolean(errors.year)}
              />
              {errors.year ? <span className="field-error">{errors.year}</span> : null}
            </label>
          </div>

          <div className="evaluation-score-table" role="table" aria-label="Evaluation criteria">
            <div className="evaluation-score-header" role="row">
              <span role="columnheader">Evaluation criterion</span>
              <span role="columnheader">Weight</span>
              <span role="columnheader">Score / 5</span>
            </div>
            {config.kpis.map((kpi) => (
              <div className="evaluation-score-row" role="row" key={kpi._id}>
                <div className="evaluation-score-row__main">
                  <span role="cell">{kpi.name}</span>
                  <span role="cell">{kpi.weight}%</span>
                  <span role="cell">
                    <select
                      aria-label={`${kpi.name} score`}
                      value={draft.scores[kpi._id] || ''}
                      onChange={(event) => updateScore(kpi._id, event.target.value)}
                      aria-invalid={Boolean(errors.scores?.[kpi._id])}
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                    </select>
                  </span>
                </div>
                {errors.scores?.[kpi._id] ? <span className="field-error evaluation-score-error">{errors.scores[kpi._id]}</span> : null}
                <label className="evaluation-kpi-comment">
                  <span>Optional comment</span>
                  <input
                    value={draft.kpiComments[kpi._id] || ''}
                    onChange={(event) => updateKpiComment(kpi._id, event.target.value)}
                    placeholder={`Add context for ${kpi.name}`}
                    maxLength="500"
                    aria-invalid={Boolean(errors.kpiComments?.[kpi._id])}
                  />
                  {errors.kpiComments?.[kpi._id] ? <span className="field-error">{errors.kpiComments[kpi._id]}</span> : null}
                </label>
              </div>
            ))}
          </div>

          <div className="evaluation-preview-banner" aria-live="polite">
            <span>Weighted score preview</span>
            <strong>{previewScore === null ? '—' : previewScore.toFixed(2)} <small>/ 5</small></strong>
            <span>{preview ? `${formatEnum(preview.rating)} performance · ${formatEnum(preview.risk)} risk` : 'Complete every KPI score to see a preview.'}</span>
          </div>

          <label className="field evaluation-overall-comments">
            <span>Overall comments</span>
            <textarea
              value={draft.comments}
              onChange={(event) => updateDraft('comments', event.target.value)}
              placeholder="Explain the supplier’s performance"
              rows="4"
              maxLength="2000"
              aria-invalid={Boolean(errors.comments)}
            />
            {errors.comments ? <span className="field-error">{errors.comments}</span> : null}
          </label>

          <button className="button button--primary" type="submit" disabled={!config.valid}>
            Review evaluation
          </button>
        </form>
      ) : null}
    </div>
  )
}
