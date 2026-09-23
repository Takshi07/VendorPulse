import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pending = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    cancelButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !pending) onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, open, pending])

  if (!open) return null

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !pending) onCancel()
    }}>
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <button
          type="button"
          className="confirm-dialog__close"
          onClick={onCancel}
          disabled={pending}
          aria-label="Close confirmation"
        >
          <X aria-hidden="true" />
        </button>
        <div className="confirm-dialog__icon" aria-hidden="true"><AlertTriangle /></div>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="confirm-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Archiving…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
