export const emptyKpiForm = {
  name: '',
  weight: '10',
  description: '',
  status: 'ACTIVE',
}

export function kpiToForm(kpi) {
  return {
    name: kpi.name || '',
    weight: String(kpi.weight ?? ''),
    description: kpi.description || '',
    status: kpi.status || 'ACTIVE',
  }
}

export function validateKpi(values) {
  const errors = {}
  const numericWeight = Number(values.weight)

  if (!values.name.trim()) errors.name = 'KPI name is required.'

  if (values.weight === '' || !Number.isFinite(numericWeight)) {
    errors.weight = 'Enter a valid KPI weight.'
  } else if (numericWeight <= 0 || numericWeight > 100) {
    errors.weight = 'KPI weight must be greater than 0 and at most 100.'
  }

  return errors
}

export function toKpiPayload(values) {
  return {
    name: values.name.trim(),
    weight: Number(values.weight),
    description: values.description.trim(),
    status: values.status,
  }
}

export function getActiveWeightTotal(kpis) {
  return kpis
    .filter((kpi) => kpi.status === 'ACTIVE')
    .reduce((total, kpi) => total + Number(kpi.weight), 0)
}

export function isValidActiveTotal(total) {
  return Math.abs(total - 100) <= 0.000001
}

export function formatWeight(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '0'
  return Number.isInteger(numericValue) ? String(numericValue) : String(numericValue)
}

export function formatWeightTotal(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00'
}
