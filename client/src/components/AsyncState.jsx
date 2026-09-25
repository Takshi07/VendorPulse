import { AlertCircle, Inbox } from 'lucide-react'

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-panel surface" aria-live="polite" aria-busy="true">
      <div>
        <div className="spinner" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className="state-panel state-panel--empty surface">
      <div>
        <Inbox className="state-panel__icon" aria-hidden="true" />
        <h2>{title}</h2>
        {message ? <p>{message}</p> : null}
      </div>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state-panel surface" role="alert">
      <div>
        <AlertCircle className="state-panel__icon" aria-hidden="true" />
        <h2>{title}</h2>
        <p>{message || 'Please try again.'}</p>
        {onRetry ? (
          <button className="button button--secondary" type="button" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    </div>
  )
}
