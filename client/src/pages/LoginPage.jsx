import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import Brand from '../components/Brand.jsx'

export default function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Enter your email address and password.')
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email: form.email.trim(), password: form.password })
      const destination = location.state?.from?.pathname || '/dashboard'
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
          <LockKeyhole aria-hidden="true" />
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
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                disabled={isSubmitting}
                required
              />
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
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                disabled={isSubmitting}
                required
              />
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
