import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { useAuth } from './useAuth.js'

export function ProtectedRoute({ allowedRoles }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="app-loading" aria-live="polite" aria-busy="true">
        <div className="app-loading__content">
          <Brand />
          <div className="spinner" aria-label="Restoring your session" />
        </div>
      </main>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />
  }

  return <Outlet />
}
