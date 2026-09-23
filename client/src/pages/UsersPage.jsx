import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Pagination from '../components/Pagination.jsx'
import { AccountStatusBadge, RoleBadge } from '../components/UserBadges.jsx'
import { USER_ROLES, USER_STATUSES } from '../users/userUtils.js'
import './UserPages.css'

const PAGE_SIZE = 10

function UserListSkeleton() {
  return (
    <div className="user-table-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading users</span>
      {[0, 1, 2, 3].map((row) => <span key={row} />)}
    </div>
  )
}

export default function UsersPage() {
  const location = useLocation()
  const { restoreSession } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [notice, setNotice] = useState(location.state?.success || '')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()

    async function loadUsers() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/users', {
          query: { page, limit: PAGE_SIZE, search: debouncedSearch, role, status },
          signal: controller.signal,
        })
        setData(response)
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load users. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadUsers()
    return () => controller.abort()
  }, [debouncedSearch, page, requestVersion, restoreSession, role, status])

  function updateRole(value) {
    setRole(value)
    setPage(1)
  }

  function updateStatus(value) {
    setStatus(value)
    setPage(1)
  }

  const users = data?.users || []
  const hasFilters = Boolean(debouncedSearch || role || status)

  return (
    <div className="page-container users-page">
      <PageHeader
        title="User Management"
        description="Manage access to your supplier workspace."
        actions={(
          <Link className="button button--primary" to="/users/new">
            <Plus aria-hidden="true" /> Add user
          </Link>
        )}
      />

      {notice ? (
        <div className="user-success-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">Dismiss</button>
        </div>
      ) : null}

      <section className="surface user-list-card">
        <div className="user-filters">
          <label className="field user-search-field">
            <span>Search users</span>
            <span className="input-with-icon">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email"
              />
            </span>
          </label>
          <label className="field">
            <span>Role</span>
            <select value={role} onChange={(event) => updateRole(event.target.value)}>
              <option value="">All roles</option>
              {USER_ROLES.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => updateStatus(event.target.value)}>
              <option value="">All statuses</option>
              {USER_STATUSES.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        {loading && !data ? <UserListSkeleton /> : null}
        {error && !data ? (
          <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
        ) : null}

        {data ? (
          <div className={loading ? 'user-results is-refreshing' : 'user-results'}>
            {error ? (
              <div className="user-inline-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>Try again</button>
              </div>
            ) : null}

            {users.length === 0 ? (
              <EmptyState
                title={hasFilters ? 'No users match these filters' : 'No users yet'}
                message={hasFilters
                  ? 'Try a different search, role, or status.'
                  : 'User accounts will appear here once they are added.'}
              />
            ) : (
              <div className="table-scroll">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((managedUser) => (
                      <tr key={managedUser._id}>
                        <td>{managedUser.name}</td>
                        <td>{managedUser.email}</td>
                        <td><RoleBadge role={managedUser.role} /></td>
                        <td><AccountStatusBadge status={managedUser.status} /></td>
                        <td><Link className="table-action" to={`/users/${managedUser._id}/edit`}>Edit</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              label="users"
              onChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
