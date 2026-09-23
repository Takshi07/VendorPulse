import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RatingBadge from '../components/RatingBadge.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import { comparisonErrorMessage, validateComparison } from '../comparison/comparisonUtils.js'
import { currentPeriod, periodLabel } from '../evaluations/evaluationUtils.js'
import { loadAllSuppliers } from '../suppliers/supplierApi.js'
import './CompareReports.css'

function CompareSkeleton() {
  return (
    <div className="compare-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading comparison</span>
      {[0, 1, 2, 3, 4].map((row) => <span key={row} />)}
    </div>
  )
}

export default function ComparePage() {
  const { restoreSession } = useAuth()
  const [initialPeriod] = useState(() => currentPeriod())
  const [suppliers, setSuppliers] = useState([])
  const [supplierIds, setSupplierIds] = useState([])
  const [year, setYear] = useState(initialPeriod.year)
  const [quarter, setQuarter] = useState(initialPeriod.quarter)
  const [comparison, setComparison] = useState(null)
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSuppliers() {
      setLoadingSuppliers(true)
      setLoadError('')
      try {
        setSuppliers(await loadAllSuppliers(controller.signal))
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setLoadError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load suppliers. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoadingSuppliers(false)
      }
    }

    loadSuppliers()
    return () => controller.abort()
  }, [requestVersion, restoreSession])

  function toggleSupplier(supplierId) {
    setSupplierIds((current) => (
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : current.length < 3 ? [...current, supplierId] : current
    ))
    setErrors((current) => ({ ...current, suppliers: undefined }))
    setSubmitError('')
    setComparison(null)
  }

  function updateYear(value) {
    setYear(value)
    setErrors((current) => ({ ...current, year: undefined }))
    setSubmitError('')
    setComparison(null)
  }

  function updateQuarter(value) {
    setQuarter(value)
    setErrors((current) => ({ ...current, quarter: undefined }))
    setSubmitError('')
    setComparison(null)
  }

  async function submitComparison(event) {
    event.preventDefault()
    const validationErrors = validateComparison({ supplierIds, year, quarter })
    setErrors(validationErrors)
    setSubmitError('')
    if (Object.keys(validationErrors).length) return

    setComparing(true)
    try {
      const response = await api.get('/comparisons', {
        query: { supplierIds, year, quarter },
      })
      setComparison(response)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }
      setComparison(null)
      setSubmitError(comparisonErrorMessage(requestError, suppliers, year, quarter))
    } finally {
      setComparing(false)
    }
  }

  const selectedSuppliers = supplierIds
    .map((id) => comparison?.suppliers.find((supplier) => supplier.supplierId === id))
    .filter(Boolean)

  return (
    <div className="page-container compare-page">
      <PageHeader
        title="Compare suppliers"
        description="Compare two or three suppliers evaluated using the same criteria and period."
      />

      <section className="surface compare-card">
        <form className="compare-form" onSubmit={submitComparison}>
          <div className="compare-period-grid">
            <label className="field">
              <span>Year</span>
              <input
                type="number"
                step="1"
                value={year}
                onChange={(event) => updateYear(event.target.value)}
                aria-invalid={Boolean(errors.year)}
              />
              {errors.year ? <span className="field-error">{errors.year}</span> : null}
            </label>
            <label className="field">
              <span>Quarter</span>
              <select
                value={quarter}
                onChange={(event) => updateQuarter(event.target.value)}
                aria-invalid={Boolean(errors.quarter)}
              >
                {[1, 2, 3, 4].map((value) => <option value={value} key={value}>Q{value}</option>)}
              </select>
              {errors.quarter ? <span className="field-error">{errors.quarter}</span> : null}
            </label>
          </div>

          <fieldset className="supplier-picker" disabled={loadingSuppliers || Boolean(loadError)}>
            <legend>Select suppliers</legend>
            <p>Choose exactly 2 or 3 suppliers. All must have an evaluation for the selected period.</p>
            {loadingSuppliers ? (
              <div className="supplier-picker__loading" aria-live="polite">Loading suppliers…</div>
            ) : null}
            {!loadingSuppliers && !loadError ? (
              <div className="supplier-picker__list">
                {suppliers.map((supplier) => {
                  const selected = supplierIds.includes(supplier._id)
                  return (
                    <label className={selected ? 'supplier-choice is-selected' : 'supplier-choice'} key={supplier._id}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!selected && supplierIds.length === 3}
                        onChange={() => toggleSupplier(supplier._id)}
                      />
                      <span>
                        <strong>{supplier.supplierName}</strong>
                        <small>{supplier.category}{supplier.status === 'ARCHIVED' ? ' · Archived' : ''}</small>
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : null}
            {!loadingSuppliers && !loadError && suppliers.length === 0 ? (
              <div className="supplier-picker__empty">No suppliers are available to compare.</div>
            ) : null}
            {errors.suppliers ? <span className="field-error">{errors.suppliers}</span> : null}
          </fieldset>

          {loadError ? (
            <ErrorState message={loadError} onRetry={() => setRequestVersion((version) => version + 1)} />
          ) : null}

          {!loadError ? (
            <div className="compare-form__actions">
              <span>{supplierIds.length} of 3 selected</span>
              <button className="button button--primary" type="submit" disabled={comparing || suppliers.length < 2}>
                {comparing ? 'Comparing…' : 'Compare selected'}
              </button>
            </div>
          ) : null}
        </form>

        {submitError ? <div className="compare-error" role="alert">{submitError}</div> : null}
        {comparing ? <CompareSkeleton /> : null}

        {!comparing && comparison ? (
          <section className="comparison-results" aria-labelledby="comparison-heading">
            <div className="comparison-results__heading">
              <div>
                <h2 id="comparison-heading">Supplier comparison</h2>
                <p>{periodLabel(comparison.period.year, comparison.period.quarter)} · Same saved KPI criteria</p>
              </div>
              <span>{selectedSuppliers.length} suppliers</span>
            </div>

            <div className="table-scroll">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Performance criterion</th>
                    {selectedSuppliers.map((supplier) => <th key={supplier.supplierId}>{supplier.supplierName}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {comparison.criteria.map((criterion) => (
                    <tr key={criterion.kpiId}>
                      <th scope="row">
                        <span>{criterion.kpiName}</span>
                        <small>{criterion.weight}% weight</small>
                      </th>
                      {selectedSuppliers.map((supplier) => {
                        const score = criterion.scores.find((item) => item.supplierId === supplier.supplierId)?.score
                        return <td key={supplier.supplierId}>{score ?? 'Not available'}{score != null ? ' / 5' : ''}</td>
                      })}
                    </tr>
                  ))}
                  <tr className="comparison-table__summary">
                    <th scope="row">Overall score</th>
                    {selectedSuppliers.map((supplier) => (
                      <td key={supplier.supplierId}><strong>{Number(supplier.overallScore).toFixed(2)}</strong><span> / 5</span></td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Performance rating</th>
                    {selectedSuppliers.map((supplier) => (
                      <td key={supplier.supplierId}><RatingBadge rating={supplier.performanceRating} /></td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Risk level</th>
                    {selectedSuppliers.map((supplier) => (
                      <td key={supplier.supplierId}><RiskBadge risk={supplier.riskLevel} /></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!comparing && !comparison && !submitError && !loadError ? (
          <EmptyState
            title="Select suppliers to compare"
            message="Choose a period and two or three suppliers to view their saved evaluation results side by side."
          />
        ) : null}
      </section>
    </div>
  )
}
