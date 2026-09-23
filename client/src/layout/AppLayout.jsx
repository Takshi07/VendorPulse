import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Building2,
  ClipboardCheck,
  Columns2,
  FileChartColumn,
  LayoutDashboard,
  Menu,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth.js'
import Brand from '../components/Brand.jsx'

const workspaceNavigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Suppliers', to: '/suppliers', icon: Building2 },
  { label: 'Evaluations', to: '/evaluations', icon: ClipboardCheck },
  { label: 'Compare', to: '/compare', icon: Columns2 },
  { label: 'Reports', to: '/reports', icon: FileChartColumn },
]

const adminNavigation = [
  { label: 'KPI Management', to: '/kpis', icon: SlidersHorizontal },
  { label: 'User Management', to: '/users', icon: Users },
]

function formatRole(role) {
  const labels = {
    ADMIN: 'Administrator',
    PROCUREMENT_MANAGER: 'Procurement Manager',
    VIEWER: 'Viewer',
  }

  return labels[role] || role
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function NavGroup({ label, items, onNavigate }) {
  return (
    <nav className="nav-group" aria-label={label}>
      <span className="nav-label">{label}</span>
      <ul className="nav-list">
        {items.map(({ label: itemLabel, to, icon: Icon }) => (
          <li key={to}>
            <NavLink className="nav-link" to={to} onClick={onNavigate}>
              <Icon aria-hidden="true" />
              <span>{itemLabel}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    function closeProfile(event) {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false)
    }

    document.addEventListener('pointerdown', closeProfile)
    return () => document.removeEventListener('pointerdown', closeProfile)
  }, [])

  async function handleLogout() {
    setIsSigningOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div>
      <header className="app-header">
        <Brand />
        <div className="app-header__actions">
          <button
            className="icon-button"
            type="button"
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          <div ref={profileRef}>
            <button
              className="profile-button"
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="profile-avatar" aria-hidden="true">{initials(user.name)}</span>
              <span className="profile-copy">
                <span className="profile-name">{user.name}</span>
                <span className="profile-role">{formatRole(user.role)}</span>
              </span>
            </button>

            {profileOpen ? (
              <div className="profile-menu" role="menu">
                <button type="button" role="menuitem" disabled={isSigningOut} onClick={handleLogout}>
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside className={`app-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <NavGroup label="Workspace" items={workspaceNavigation} onNavigate={() => setSidebarOpen(false)} />
        {user.role === 'ADMIN' ? (
          <NavGroup label="Administration" items={adminNavigation} onNavigate={() => setSidebarOpen(false)} />
        ) : null}
        <div className="sidebar-footer">VendorPulse</div>
      </aside>

      {sidebarOpen ? (
        <button
          className="mobile-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
