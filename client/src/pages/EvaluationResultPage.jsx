import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { ErrorState, LoadingState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RatingBadge from '../components/RatingBadge.jsx'
import { formatEnum, periodLabel } from '../evaluations/evaluationUtils.js'
import './EvaluationPages.css'

export default function EvaluationResultPage() {
  const { evaluationId } = useParams()
  const location = useLocation()
  const { restoreSession } = useAuth()
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [notice, setNotice] = useState(location.state?.success || '')

  useEffect(() => {
    const controller = new AbortController()

    async function loadEvaluation() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`/evaluations/${evaluationId}`, { signal: controller.signal })
        setEvaluation(response.evaluation)
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load this evaluation. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadEvaluation()
    return () => controller.abort()
  }, [evaluationId, requestVersion, restoreSession])

  if (loading && !evaluation) {
    return <div className="page-container"><LoadingState label="Loading evaluation result…" /></div>
  }

  if (error && !evaluation) {
    return (
      <div className="page-container">
        <PageHeader title="Evaluation result" description="Submitted evaluation details are read-only." />
        <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
      </div>
    )
  }

  if (!evaluation) return null

  return (
    <div className="page-container evaluation-result-page">
      <PageHeader
        title="Evaluation result"
        description={`${evaluation.supplierId?.supplierName || 'Unavailable supplier'} · ${periodLabel(evaluation.year, evaluation.quarter)}`}
        actions={<Link className="button button--secondary" to="/evaluations">Back to evaluations</Link>}
      />

      {notice ? (
        <div className="evaluation-success-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">Dismiss</button>
        </div>
      ) : null}

      {error ? <div className="evaluation-inline-error" role="alert">{error}</div> : null}

      <section className="surface evaluation-summary-card evaluation-result-card">
        <span className="evaluation-readonly-label">Submitted · Read-only</span>
        <div className="evaluation-score-display">
          <strong>{Number(evaluation.overallScore).toFixed(2)}</strong><span>/ 5</span>
        </div>
        <p className="evaluation-classification">
          <RatingBadge rating={evaluation.performanceRating} />
          <span>performance · {formatEnum(evaluation.riskLevel)} risk</span>
        </p>

        <div className="evaluation-summary-table" role="table" aria-label="Submitted KPI score snapshots">
          <div className="evaluation-summary-header" role="row">
            <span role="columnheader">KPI</span>
            <span role="columnheader">Weight</span>
            <span role="columnheader">Score / 5</span>
          </div>
          {evaluation.scores.map((score) => (
            <div className="evaluation-summary-row" role="row" key={String(score.kpiId)}>
              <div role="cell">
                <span>{score.kpiNameSnapshot}</span>
                {score.comment ? <small>{score.comment}</small> : null}
              </div>
              <span role="cell">{score.weightSnapshot}%</span>
              <span role="cell">{score.score}</span>
            </div>
          ))}
        </div>

        <div className="evaluation-comment-summary">
          <span>Overall comments</span>
          <p>{evaluation.comments || 'No overall comments provided.'}</p>
        </div>

        <div className="evaluation-information-banner">
          KPI names and weights are preserved from the time of submission.
        </div>
      </section>
    </div>
  )
}
