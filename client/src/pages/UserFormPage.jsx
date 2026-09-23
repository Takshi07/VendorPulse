import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { ErrorState, LoadingState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { loadUserById } from '../users/userApi.js'
import {
  apiFieldErrors,
  emptyUserForm,
  isProtectedAdmin,
  toCreateUserPayload,
  toUpdateUserPayload,
  USER_ROLES,
  USER_STATUSES,
  userToForm,
  validateUser,
} from '../users/userUtils.js'
import './UserPages.css'

function FormField({ label, required = false, error, hint, children }) {
  return (
    <label className="field">
      <span>{label}{required ? ' *' : ''}</span>
      {children}
      {hint ? <small className="field-hint">{hint}</small> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

export default function UserFormPage({ mode }) {
  const editing = mode === 'edit'
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: signedInUser, restoreSession } = useAuth()
  const [values, setValues] = useState(emptyUserForm)
  const [managedUser, setManagedUser] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    if (!editing) return undefined
    const controller = new AbortController()

    async function loadUser() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await loadUserById(userId, controller.signal)
        setManagedUser(response)
        setValues(userToForm(response))
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setLoadError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load this user. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadUser()
    return () => controller.abort()
  }, [editing, requestVersion, restoreSession, userId])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateUser(values, { editing })
    setErrors(validationErrors)
    setSubmitError('')
    if (Object.keys(validationErrors).length) return

    setSaving(true)
    try {
      const response = editing
        ? await api.patch(`/users/${userId}`, toUpdateUserPayload(values))
        : await api.post('/users', toCreateUserPayload(values))

      if (editing && String(signedInUser.id) === String(response.user._id)) {
        await restoreSession()
      }

      navigate('/users', {
        replace: true,
        state: { success: editing
          ? `${response.user.name} updated.`
          : `${response.user.name} added with an active account.` },
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }
      const fieldErrors = apiFieldErrors(requestError)
      if (fieldErrors) {
        setErrors((current) => ({ ...current, ...fieldErrors }))
      } else {
        setSubmitError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to save this user. Check your connection and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const protectedAdmin = editing && isProtectedAdmin(managedUser)

  return (
    <div className="page-container user-form-page">
      <PageHeader
        title={editing ? 'Edit user' : 'Add user'}
        description={editing ? 'Update account details and permissions.' : 'Create an account and assign an access role.'}
        actions={<Link className="button button--secondary" to="/users">Cancel</Link>}
      />

      {loading ? <LoadingState label="Loading user…" /> : null}
      {!loading && loadError ? (
        <ErrorState message={loadError} onRetry={() => setRequestVersion((version) => version + 1)} />
      ) : null}

      {!loading && !loadError ? (
        <form className="surface user-form" onSubmit={handleSubmit} noValidate>
          {submitError ? <div className="form-error user-form__error" role="alert">{submitError}</div> : null}

          <div className="user-form__grid">
            <FormField label="Full name" required error={errors.name}>
              <input
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Enter full name"
                aria-invalid={Boolean(errors.name)}
                autoComplete="name"
              />
            </FormField>

            <FormField
              label="Email"
              required
              error={errors.email}
              hint={editing ? 'Email addresses cannot be changed after account creation.' : undefined}
            >
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="name@company.com"
                aria-invalid={Boolean(errors.email)}
                readOnly={editing}
                autoComplete="email"
              />
            </FormField>

            <FormField label="Role" error={errors.role} hint={protectedAdmin ? 'Admin accounts cannot be demoted.' : undefined}>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                aria-invalid={Boolean(errors.role)}
                disabled={protectedAdmin}
              >
                {USER_ROLES.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </FormField>

            {!editing ? (
              <FormField label="Temporary password" required error={errors.password} hint="Use at least 8 characters.">
                <input
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="Set initial password"
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="new-password"
                />
              </FormField>
            ) : (
              <FormField label="Status" error={errors.status} hint={protectedAdmin ? 'Admin accounts cannot be deactivated.' : undefined}>
                <select
                  name="status"
                  value={values.status}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.status)}
                  disabled={protectedAdmin}
                >
                  {USER_STATUSES.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
              </FormField>
            )}
          </div>

          <div className={protectedAdmin ? 'user-information-banner user-information-banner--protected' : 'user-information-banner'}>
            {editing
              ? protectedAdmin
                ? 'This Admin account must remain active and retain the Admin role. Name changes are still allowed.'
                : 'Deactivating an account retains its evaluation history and blocks future authenticated API access.'
              : 'Admin controls account access. Public registration is not available.'}
          </div>

          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save user' : 'Add user'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
