export const USER_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PROCUREMENT_MANAGER', label: 'Procurement Manager' },
  { value: 'VIEWER', label: 'Viewer' },
]

export const USER_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const validRoles = new Set(USER_ROLES.map((role) => role.value))
const validStatuses = new Set(USER_STATUSES.map((status) => status.value))
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emptyUserForm() {
  return {
    name: '',
    email: '',
    password: '',
    role: 'VIEWER',
    status: 'ACTIVE',
  }
}

export function userToForm(user) {
  return {
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'VIEWER',
    status: user.status || 'ACTIVE',
  }
}

export function validateUser(values, { editing = false } = {}) {
  const errors = {}

  if (!values.name.trim()) errors.name = 'Full name is required.'

  if (!editing) {
    if (!values.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!emailPattern.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }

    if (!values.password) {
      errors.password = 'Temporary password is required.'
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }
  }

  if (!validRoles.has(values.role)) errors.role = 'Select a valid role.'
  if (editing && !validStatuses.has(values.status)) errors.status = 'Select a valid status.'

  return errors
}

export function toCreateUserPayload(values) {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    role: values.role,
  }
}

export function toUpdateUserPayload(values) {
  return {
    name: values.name.trim(),
    role: values.role,
    status: values.status,
  }
}

export function apiFieldErrors(error) {
  const message = error?.message || ''

  if (/email/i.test(message)) return { email: message }
  if (/name.*required/i.test(message)) return { name: message }
  if (/password/i.test(message)) return { password: message }
  if (/role/i.test(message) && !/admin accounts/i.test(message)) return { role: message }
  if (/status/i.test(message)) return { status: message }
  return null
}

export function isProtectedAdmin(user) {
  return user?.role === 'ADMIN'
}
