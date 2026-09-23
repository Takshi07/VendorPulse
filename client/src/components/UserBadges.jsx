const roleDetails = {
  ADMIN: { label: 'Admin', variant: 'admin' },
  PROCUREMENT_MANAGER: { label: 'Procurement Manager', variant: 'manager' },
  VIEWER: { label: 'Viewer', variant: 'viewer' },
}

export function RoleBadge({ role }) {
  const details = roleDetails[role] || { label: role || 'Unknown', variant: 'neutral' }
  return <span className={`role-badge role-badge--${details.variant}`}>{details.label}</span>
}

export function AccountStatusBadge({ status }) {
  return (
    <span className={status === 'ACTIVE'
      ? 'status-chip status-chip--success'
      : 'status-chip status-chip--neutral'}>
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  )
}
