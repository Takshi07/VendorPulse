export const MANAGER_ROLES = ['ADMIN', 'PROCUREMENT_MANAGER']

export const emptySupplierForm = {
  supplierName: '',
  category: '',
  contactPerson: '',
  email: '',
  phone: '',
  taxId: '',
  contractStart: '',
  contractEnd: '',
  address: '',
}

export function canManageSuppliers(role) {
  return MANAGER_ROLES.includes(role)
}

export function supplierToForm(supplier) {
  return {
    supplierName: supplier.supplierName || '',
    category: supplier.category || '',
    contactPerson: supplier.contactPerson || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    taxId: supplier.taxId || '',
    contractStart: toDateInputValue(supplier.contractStart),
    contractEnd: toDateInputValue(supplier.contractEnd),
    address: supplier.address || '',
  }
}

export function toSupplierPayload(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  )
}

export function validateSupplier(values) {
  const errors = {}

  if (!values.supplierName.trim()) errors.supplierName = 'Supplier name is required.'
  if (!values.category.trim()) errors.category = 'Supplier category is required.'

  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (values.contractStart && values.contractEnd && values.contractEnd < values.contractStart) {
    errors.contractEnd = 'Contract end date cannot be before the start date.'
  }

  return errors
}

export function toDateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function formatDate(value) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not provided'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatEnum(value = '') {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
