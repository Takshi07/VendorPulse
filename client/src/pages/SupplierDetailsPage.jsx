import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Pagination from '../components/Pagination.jsx'
import RatingBadge from '../components/RatingBadge.jsx'
import {
  canManageSuppliers,
  formatDate,
  formatEnum,
} from '../suppliers/supplierUtils.js'
import './SupplierPages.css'

const HISTORY_PAGE_SIZE = 10

function DetailItem({ label, children }) {
  return (
    <div className="supplier-detail-item">
      <dt>{label}</dt>
      <dd>{children || 'Not provided'}</dd>
    </div>
  )
}

function contractPeriod(supplier) {
  if (supplier.contractStart && supplier.contractEnd) {
    return `${formatDate(supplier.contractStart)} – ${formatDate(supplier.contractEnd)}`
  }
  if (supplier.contractStart) return `From ${formatDate(supplier.contractStart)}`
  if (supplier.contractEnd) return `Until ${formatDate(supplier.contractEnd)}`
  return null
}

export default function SupplierDetailsPage() {
  const { supplierId } = useParams()
  const location = useLocation()
  const { user, restoreSession } = useAuth()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [history, setHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [historyVersion, setHistoryVersion] = useState(0)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState('')
  const [notice, setNotice] = useState(location.state?.success || '')

  useEffect(() => {
    const controller = new AbortController()

    async function loadSupplier() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`/suppliers/${supplierId}`, { signal: controller.signal })
        setSupplier(response.supplier)
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load this supplier. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadSupplier()
    return () => controller.abort()
  }, [requestVersion, restoreSession, supplierId])

  useEffect(() => {
    const controller = new AbortController()

    async function loadHistory() {
      setHistoryLoading(true)
      setHistoryError('')
      try {
        const response = await api.get('/evaluations', {
          query: { supplierId, page: historyPage, limit: HISTORY_PAGE_SIZE },
          signal: controller.signal,
        })
        setHistory(response)
      } catch (requestError) {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          await restoreSession()
          return
        }
        setHistoryError(requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load evaluation history.')
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false)
      }
    }

    loadHistory()
    return () => controller.abort()
  }, [historyPage, historyVersion, restoreSession, supplierId])

  async function handleArchive() {
    setArchiving(true)
    setArchiveError('')
    try {
      const response = await api.patch(`/suppliers/${supplierId}/archive`)
      setSupplier(response.supplier)
      setArchiveOpen(false)
      setNotice('Supplier archived. Historical records remain available.')
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await restoreSession()
        return
      }
      setArchiveError(requestError instanceof ApiError
        ? requestError.message
        : 'Unable to archive this supplier. Please try again.')
    } finally {
      setArchiving(false)
    }
  }

  const canManage = canManageSuppliers(user.role)

  if (loading && !supplier) {
    return <div className="page-container"><LoadingState label="Loading supplier…" /></div>
  }

  if (error && !supplier) {
    return (
      <div className="page-container">
        <PageHeader title="Supplier details" description="Review supplier information and performance history." />
        <ErrorState message={error} onRetry={() => setRequestVersion((version) => version + 1)} />
      </div>
    )
  }

  if (!supplier) return null

  const isActive = supplier.status === 'ACTIVE'

  return (
    <div className="page-container supplier-details-page">
      <PageHeader
        title={supplier.supplierName}
        description={`${supplier.category} · ${formatEnum(supplier.status)} supplier`}
        actions={canManage ? (
          <div className="page-actions">
            <Link className="button button--secondary" to={`/suppliers/${supplier._id}/edit`}>Edit details</Link>
            {isActive ? (
              <Link className="button button--primary" to={`/evaluations/new?supplierId=${supplier._id}`}>
                Evaluate supplier
              </Link>
            ) : null}
          </div>
        ) : null}
      />

      {notice ? (
        <div className="success-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">Dismiss</button>
        </div>
      ) : null}

      {error ? <div className="inline-error" role="alert">{error}</div> : null}

      <section className="surface supplier-details-card">
        <h2>Supplier details</h2>
        <dl className="supplier-details-grid">
          <DetailItem label="Contact person">{supplier.contactPerson}</DetailItem>
          <DetailItem label="Email">
            {supplier.email ? <a href={`mailto:${supplier.email}`}>{supplier.email}</a> : null}
          </DetailItem>
          <DetailItem label="Phone">{supplier.phone}</DetailItem>
          <DetailItem label="Address">{supplier.address}</DetailItem>
          <DetailItem label="Tax ID">{supplier.taxId}</DetailItem>
          <DetailItem label="Contract period">
            {contractPeriod(supplier)}
          </DetailItem>
        </dl>

        {canManage && isActive ? (
          <button className="button button--secondary archive-button" type="button" onClick={() => {
            setArchiveError('')
            setArchiveOpen(true)
          }}>
            Archive supplier
          </button>
        ) : null}
      </section>

      <section className="surface supplier-history-card">
        <h2>Evaluation history</h2>

        {historyLoading && !history ? <div className="history-loading"><span className="spinner" /><span>Loading history…</span></div> : null}
        {historyError && !history ? (
          <ErrorState message={historyError} onRetry={() => setHistoryVersion((version) => version + 1)} />
        ) : null}

        {history ? (
          <div className={historyLoading ? 'history-content is-refreshing' : 'history-content'}>
            {historyError ? (
              <div className="inline-error" role="alert">
                <span>{historyError}</span>
                <button type="button" onClick={() => setHistoryVersion((version) => version + 1)}>Try again</button>
              </div>
            ) : null}

            {history.evaluations.length === 0 ? (
              <EmptyState
                title="No evaluations yet"
                message={isActive
                  ? 'Submitted evaluations for this supplier will appear here.'
                  : 'No historical evaluations are recorded for this archived supplier.'}
              />
            ) : (
              <div className="table-scroll">
                <table className="supplier-table history-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Score / 5</th>
                      <th>Rating</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.evaluations.map((evaluation) => (
                      <tr key={evaluation._id}>
                        <td>Q{evaluation.quarter} {evaluation.year}</td>
                        <td>{Number(evaluation.overallScore).toFixed(2)}</td>
                        <td><RatingBadge rating={evaluation.performanceRating} /></td>
                        <td><Link className="table-action" to={`/evaluations/${evaluation._id}`}>View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={history.pagination.page}
              totalPages={history.pagination.totalPages}
              total={history.pagination.total}
              label="evaluations"
              onChange={setHistoryPage}
            />
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive supplier?"
        message={`${supplier.supplierName} will remain available for historical viewing but cannot be selected for new evaluations.`}
        confirmLabel="Archive supplier"
        pending={archiving}
        error={archiveError}
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
      />
    </div>
  )
}
