import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { ErrorState, LoadingState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import {
  emptyKpiForm,
  kpiToForm,
  toKpiPayload,
  validateKpi,
} from '../kpis/kpiUtils.js'
import './KpiPages.css'

function FormField({ label, required = false, error, children, className = '' }) {
  return (
    <label className={`field${className ? ` ${className}` : ''}`}>
      <span>{label}{required ? ' *' : ''}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

export default function KpiFormPage({ mode }) {
  const editing = mode === 'edit'
  const { kpiId } = useParams()
  const navigate = useNavigate()
  const { restoreSession } = useAuth()
  const [values, setValues] = useState(emptyKpiForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    if (!editing) return undefined

    const controller = new AbortController()

    async function loadKpi() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await api.get(`/kpis/${kpiId}`, { signal: controller.signal })
        setValues(kpiToForm(response.kpi))
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setLoadError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load this KPI. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadKpi()
    return () => controller.abort()
  }, [editing, kpiId, requestVersion, restoreSession])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateKpi(values)
    setErrors(validationErrors)
    setSubmitError('')
    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    try {
      const payload = toKpiPayload(values)
      const response = editing
        ? await api.patch(`/kpis/${kpiId}`, payload)
        : await api.post('/kpis', payload)

      navigate('/kpis', {
        replace: true,
        state: { success: editing
          ? `${response.kpi.name} updated. Changes apply only to future evaluations.`
          : `${response.kpi.name} added. Review active weights before the next evaluation.` },
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }
      setSubmitError(requestError instanceof ApiError
        ? requestError.message
        : 'Unable to save this KPI. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container kpi-form-page">
      <PageHeader
        title={editing ? 'Edit KPI' : 'Add KPI'}
        description="Define a criterion and its weight for future evaluations."
        actions={<Link className="button button--secondary" to="/kpis">Cancel</Link>}
      />

      {loading ? <LoadingState label="Loading KPI…" /> : null}
      {!loading && loadError ? (
        <ErrorState message={loadError} onRetry={() => setRequestVersion((version) => version + 1)} />
      ) : null}

      {!loading && !loadError ? (
        <form className="surface kpi-form" onSubmit={handleSubmit} noValidate>
          {submitError ? <div className="form-error kpi-form__error" role="alert">{submitError}</div> : null}

          <div className="kpi-form__grid">
            <FormField label="KPI name" required error={errors.name}>
              <input
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Enter criterion name"
                aria-invalid={Boolean(errors.name)}
                required
              />
            </FormField>
            <FormField label="Weight (%)" required error={errors.weight}>
              <input
                name="weight"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={values.weight}
                onChange={handleChange}
                aria-invalid={Boolean(errors.weight)}
                required
              />
            </FormField>
            <FormField label="Description" className="kpi-form__description">
              <textarea
                name="description"
                value={values.description}
                onChange={handleChange}
                placeholder="Explain what evaluators should assess"
                rows="4"
              />
            </FormField>
            <FormField label="Status" className="kpi-form__status">
              <select name="status" value={values.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="kpi-information-banner">
            Active criteria must total 100% before an evaluation can be submitted.
          </div>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save KPI'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
