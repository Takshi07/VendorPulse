import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { ErrorState, LoadingState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import {
  emptySupplierForm,
  supplierToForm,
  toSupplierPayload,
  validateSupplier,
} from '../suppliers/supplierUtils.js'
import './SupplierPages.css'

function FormField({ label, required = false, error, children }) {
  return (
    <label className="field">
      <span>{label}{required ? ' *' : ''}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

export default function SupplierFormPage({ mode }) {
  const editing = mode === 'edit'
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const { restoreSession } = useAuth()
  const [values, setValues] = useState(emptySupplierForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    if (!editing) return undefined

    const controller = new AbortController()

    async function loadSupplier() {
      setLoading(true)
      setLoadError('')

      try {
        const response = await api.get(`/suppliers/${supplierId}`, { signal: controller.signal })
        setValues(supplierToForm(response.supplier))
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setLoadError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load this supplier. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadSupplier()
    return () => controller.abort()
  }, [editing, requestVersion, restoreSession, supplierId])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateSupplier(values)
    setErrors(validationErrors)
    setSubmitError('')

    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    try {
      const payload = toSupplierPayload(values)
      const response = editing
        ? await api.patch(`/suppliers/${supplierId}`, payload)
        : await api.post('/suppliers', payload)

      navigate(`/suppliers/${response.supplier._id}`, {
        replace: true,
        state: { success: editing ? 'Supplier details updated.' : 'Supplier added successfully.' },
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }
      setSubmitError(requestError instanceof ApiError
        ? requestError.message
        : 'Unable to save this supplier. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const cancelPath = editing ? `/suppliers/${supplierId}` : '/suppliers'
  const title = editing ? 'Edit supplier' : 'Add supplier'

  return (
    <div className="page-container supplier-form-page">
      <PageHeader
        title={title}
        description="Keep contact and contract details in one place."
        actions={<Link className="button button--secondary" to={cancelPath}>Cancel</Link>}
      />

      {loading ? <LoadingState label="Loading supplier…" /> : null}
      {!loading && loadError ? (
        <ErrorState message={loadError} onRetry={() => setRequestVersion((version) => version + 1)} />
      ) : null}

      {!loading && !loadError ? (
        <form className="surface supplier-form" onSubmit={handleSubmit} noValidate>
          {submitError ? <div className="form-error supplier-form__error" role="alert">{submitError}</div> : null}

          <div className="supplier-form__grid">
            <FormField label="Supplier name" name="supplierName" required error={errors.supplierName}>
              <input
                id="supplierName"
                name="supplierName"
                value={values.supplierName}
                onChange={handleChange}
                placeholder="Enter supplier name"
                aria-invalid={Boolean(errors.supplierName)}
                required
              />
            </FormField>
            <FormField label="Category" name="category" required error={errors.category}>
              <input
                id="category"
                name="category"
                value={values.category}
                onChange={handleChange}
                placeholder="Enter category"
                aria-invalid={Boolean(errors.category)}
                required
              />
            </FormField>
            <FormField label="Contact person" name="contactPerson">
              <input id="contactPerson" name="contactPerson" value={values.contactPerson} onChange={handleChange} placeholder="Enter contact person" />
            </FormField>
            <FormField label="Email" name="email" error={errors.email}>
              <input
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="Enter email"
                aria-invalid={Boolean(errors.email)}
              />
            </FormField>
            <FormField label="Phone" name="phone">
              <input id="phone" name="phone" type="tel" value={values.phone} onChange={handleChange} placeholder="Enter phone" />
            </FormField>
            <FormField label="Tax ID" name="taxId">
              <input id="taxId" name="taxId" value={values.taxId} onChange={handleChange} placeholder="Optional tax identifier" />
            </FormField>
            <FormField label="Contract start" name="contractStart">
              <input id="contractStart" name="contractStart" type="date" value={values.contractStart} onChange={handleChange} />
            </FormField>
            <FormField label="Contract end" name="contractEnd" error={errors.contractEnd}>
              <input
                id="contractEnd"
                name="contractEnd"
                type="date"
                value={values.contractEnd}
                onChange={handleChange}
                min={values.contractStart || undefined}
                aria-invalid={Boolean(errors.contractEnd)}
              />
            </FormField>
            <FormField label="Address" name="address">
              <textarea id="address" name="address" value={values.address} onChange={handleChange} placeholder="Enter supplier address" rows="4" />
            </FormField>
          </div>

          <p className="supplier-form__required">* Required field</p>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save supplier'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
