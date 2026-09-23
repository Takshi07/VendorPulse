import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState } from '../components/AsyncState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Pagination from '../components/Pagination.jsx'
import { canManageSuppliers, formatEnum } from '../suppliers/supplierUtils.js'
import './SupplierPages.css'

const PAGE_SIZE = 10

function SuppliersSkeleton() {
  return (
    <div className="supplier-table-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading suppliers</span>
      {[0, 1, 2, 3].map((row) => <span key={row} />)}
    </div>
  )
}

export default function SuppliersPage() {
  const { user, restoreSession } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedCategory, setDebouncedCategory] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setDebouncedCategory(category.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [category, search])

  useEffect(() => {
    const controller = new AbortController()

    async function loadSuppliers() {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/suppliers', {
          query: {
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch,
            category: debouncedCategory,
            status,
          },
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
          : 'Unable to load suppliers. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadSuppliers()
    return () => controller.abort()
  }, [debouncedCategory, debouncedSearch, page, requestVersion, restoreSession, status])

  function handleStatusChange(event) {
    setStatus(event.target.value)
    setPage(1)
  }

  const suppliers = data?.suppliers || []
  const hasFilters = Boolean(debouncedSearch || debouncedCategory || status)

  return (
    <div className="page-container suppliers-page">
      <PageHeader
        title="Suppliers"
        description="Manage your vendor records and performance history."
        actions={canManageSuppliers(user.role) ? (
          <Link className="button button--primary" to="/suppliers/new">
            <Plus aria-hidden="true" /> Add supplier
          </Link>
        ) : null}
      />

      <section className="surface supplier-list-card">
        <div className="supplier-filters">
          <label className="field supplier-search-field">
            <span>Search suppliers</span>
            <span className="input-with-icon">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, contact, email or tax ID"
              />
            </span>
          </label>
          <label className="field">
            <span>Category</span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="All categories"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={handleStatusChange}>
              <option value="ACTIVE">Active suppliers</option>
              <option value="ARCHIVED">Archived suppliers</option>
              <option value="">All suppliers</option>
            </select>
          </label>
        </div>

        {loading && !data ? <SuppliersSkeleton /> : null}

        {error && !data ? (
          <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
        ) : null}

        {data ? (
          <div className={loading ? 'supplier-results is-refreshing' : 'supplier-results'}>
            {error ? (
              <div className="inline-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>Try again</button>
              </div>
            ) : null}

            {suppliers.length === 0 ? (
              <EmptyState
                title={hasFilters ? 'No suppliers match these filters' : 'No suppliers yet'}
                message={hasFilters
                  ? 'Try a different search, category, or status.'
                  : 'Supplier records will appear here once they are added.'}
              />
            ) : (
              <div className="table-scroll">
                <table className="supplier-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier._id}>
                        <td>{supplier.supplierName}</td>
                        <td>{supplier.category}</td>
                        <td>
                          <span className={supplier.status === 'ACTIVE'
                            ? 'status-chip status-chip--success'
                            : 'status-chip status-chip--neutral'}>
                            {formatEnum(supplier.status)}
                          </span>
                        </td>
                        <td><Link className="table-action" to={`/suppliers/${supplier._id}`}>View</Link></td>
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
              label="suppliers"
              onChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
