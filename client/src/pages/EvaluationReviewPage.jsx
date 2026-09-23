import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import PageHeader from '../components/PageHeader.jsx'
import RatingBadge from '../components/RatingBadge.jsx'
import {
  calculateWeightedPreview,
  formatEnum,
  periodLabel,
  previewClassification,
  reconcileDraft,
  toEvaluationPayload,
} from '../evaluations/evaluationUtils.js'
import './EvaluationPages.css'

export default function EvaluationReviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { restoreSession } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const state = location.state

  if (!state?.draft || !state?.config) return <Navigate to="/evaluations/new" replace />

  const { draft, config } = state
  const supplier = config.suppliers.find((item) => item._id === draft.supplierId)
  if (!supplier) return <Navigate to="/evaluations/new" replace state={{ draft }} />

  const previewScore = calculateWeightedPreview(config.kpis, draft.scores)
  const preview = previewClassification(previewScore)

  if (previewScore === null || !preview) {
    return <Navigate to="/evaluations/new" replace state={{ draft, refreshedConfig: config }} />
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await api.post('/evaluations', toEvaluationPayload(draft, config))
      navigate(`/evaluations/${response.evaluation._id}`, {
        replace: true,
        state: { success: 'Evaluation submitted successfully.' },
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }

      if (requestError instanceof ApiError && requestError.code === 'CRITERIA_CHANGED') {
        try {
          const refreshedConfig = await api.get('/evaluation-config')
          navigate('/evaluations/new', {
            replace: true,
            state: {
              draft: reconcileDraft(draft, refreshedConfig),
              refreshedConfig,
              criteriaChanged: true,
            },
          })
          return
        } catch (refreshError) {
          if (refreshError instanceof ApiError && refreshError.status === 401) {
            await restoreSession()
            return
          }
          setSubmitError(refreshError instanceof ApiError
            ? refreshError.message
            : 'The criteria changed, but the updated configuration could not be loaded. Try again.')
          return
        }
      }

      setSubmitError(requestError instanceof ApiError
        ? requestError.message
        : 'Unable to submit this evaluation. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container evaluation-review-page">
      <PageHeader
        title="Review evaluation"
        description={`${supplier.supplierName} · ${periodLabel(draft.year, draft.quarter)}`}
        actions={(
          <Link className="button button--secondary" to="/evaluations/new" state={{ draft, refreshedConfig: config }}>
            Back to evaluation
          </Link>
        )}
      />

      <section className="surface evaluation-summary-card">
        {submitError ? <div className="form-error evaluation-submit-error" role="alert">{submitError}</div> : null}

        <span className="evaluation-readonly-label">Preview score</span>
        <div className="evaluation-score-display">
          <strong>{previewScore?.toFixed(2)}</strong><span>/ 5</span>
        </div>
        <p className="evaluation-classification">
          <RatingBadge rating={preview.rating} />
          <span>performance · {formatEnum(preview.risk)} risk</span>
        </p>

        <div className="evaluation-summary-table" role="table" aria-label="Evaluation review scores">
          <div className="evaluation-summary-header" role="row">
            <span role="columnheader">KPI</span>
            <span role="columnheader">Weight</span>
            <span role="columnheader">Score / 5</span>
          </div>
          {config.kpis.map((kpi) => (
            <div className="evaluation-summary-row" role="row" key={kpi._id}>
              <div role="cell">
                <span>{kpi.name}</span>
                {draft.kpiComments[kpi._id] ? <small>{draft.kpiComments[kpi._id]}</small> : null}
              </div>
              <span role="cell">{kpi.weight}%</span>
              <span role="cell">{draft.scores[kpi._id]}</span>
            </div>
          ))}
        </div>

        <div className="evaluation-comment-summary">
          <span>Overall comments</span>
          <p>{draft.comments || 'No overall comments provided.'}</p>
        </div>

        <div className="evaluation-information-banner">Submitting makes this evaluation read-only.</div>
        <button className="button button--primary" type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Confirm submission'}
        </button>
      </section>
    </div>
  )
}
