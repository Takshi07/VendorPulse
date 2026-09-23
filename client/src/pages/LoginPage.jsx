import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import Brand from '../components/Brand.jsx'

export default function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const validationErrors = {}

    if (!form.email.trim()) {
      validationErrors.email = 'Email address is required.'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      validationErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      validationErrors.password = 'Password is required.'
    }

    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email: form.email.trim(), password: form.password })
      const intendedLocation = location.state?.from
      const destination = intendedLocation
        ? `${intendedLocation.pathname}${intendedLocation.search || ''}${intendedLocation.hash || ''}`
        : '/dashboard'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to sign in. Check your connection and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="app-loading" aria-live="polite" aria-busy="true">
        <div className="app-loading__content">
          <Brand linkTo={null} />
          <div className="spinner" aria-label="Checking your session" />
        </div>
      </main>
    )
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <Brand linkTo={null} />
        <span className="login-header__security">
          Secure workspace
        </span>
      </header>

      <main className="login-main">
        <section className="login-card" aria-labelledby="login-title">
          <Brand linkTo={null} />
          <div className="login-card__intro">
            <h1 id="login-title">Welcome back</h1>
            <p>Sign in to your supplier performance workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={form.email}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }))
                  setFieldErrors((current) => ({ ...current, email: '' }))
                  setError('')
                }}
                disabled={isSubmitting}
                required
              />
              {fieldErrors.email ? <span className="field-error" id="email-error">{fieldErrors.email}</span> : null}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                onChange={(event) => {
                  setForm((current) => ({ ...current, password: event.target.value }))
                  setFieldErrors((current) => ({ ...current, password: '' }))
                  setError('')
                }}
                disabled={isSubmitting}
                required
              />
              {fieldErrors.password ? (
                <span className="field-error" id="password-error">{fieldErrors.password}</span>
              ) : null}
            </div>

            {error ? <div className="form-error" role="alert">{error}</div> : null}

            <button className="button button--primary login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="login-card__help">Need access? Contact your administrator.</p>
        </section>
      </main>

      <footer className="login-footer">VendorPulse · Supplier performance management</footer>
    </div>
  )
}
