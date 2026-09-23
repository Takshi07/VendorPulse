export function currentPeriod() {
  const today = new Date()
  return {
    year: String(today.getFullYear()),
    quarter: String(Math.floor(today.getMonth() / 3) + 1),
  }
}

export function emptyEvaluationDraft(supplierId = '') {
  const period = currentPeriod()
  return {
    supplierId,
    year: period.year,
    quarter: period.quarter,
    scores: {},
    kpiComments: {},
    comments: '',
    criteriaSignature: '',
  }
}

export function formatEnum(value = '') {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function periodLabel(year, quarter) {
  return `Q${quarter} ${year}`
}

export function calculateWeightedPreview(kpis, scores) {
  if (!Array.isArray(kpis) || kpis.length === 0) return null

  let weightedTotal = 0
  for (const kpi of kpis) {
    const score = Number(scores[kpi._id])
    if (!Number.isInteger(score) || score < 1 || score > 5) return null
    weightedTotal += score * Number(kpi.weight)
  }

  return Number((weightedTotal / 100).toFixed(2))
}

export function previewClassification(score) {
  if (!Number.isFinite(score)) return null
  if (score >= 4) return { rating: 'EXCELLENT', risk: 'LOW' }
  if (score >= 3) return { rating: 'GOOD', risk: 'MODERATE' }
  if (score >= 2) return { rating: 'NEEDS_IMPROVEMENT', risk: 'HIGH' }
  return { rating: 'POOR', risk: 'CRITICAL' }
}

export function validateEvaluationDraft(draft, config) {
  const errors = { scores: {}, kpiComments: {} }

  if (!draft.supplierId) errors.supplierId = 'Select a supplier.'

  const year = Number(draft.year)
  if (draft.year === '' || !Number.isInteger(year)) errors.year = 'Enter a valid year.'

  const quarter = Number(draft.quarter)
  if (![1, 2, 3, 4].includes(quarter)) errors.quarter = 'Select a quarter.'

  config.kpis.forEach((kpi) => {
    const score = Number(draft.scores[kpi._id])
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      errors.scores[kpi._id] = 'Select a whole-number score from 1 to 5.'
    }

    if ((draft.kpiComments[kpi._id] || '').length > 500) {
      errors.kpiComments[kpi._id] = 'KPI comments cannot exceed 500 characters.'
    }
  })

  if (draft.comments.length > 2000) {
    errors.comments = 'Overall comments cannot exceed 2,000 characters.'
  }

  const hasErrors = Boolean(
    errors.supplierId
    || errors.year
    || errors.quarter
    || errors.comments
    || Object.keys(errors.scores).length
    || Object.keys(errors.kpiComments).length,
  )

  return { errors, hasErrors }
}

export function toEvaluationPayload(draft, config) {
  return {
    supplierId: draft.supplierId,
    year: Number(draft.year),
    quarter: Number(draft.quarter),
    criteriaSignature: config.criteriaSignature,
    scores: config.kpis.map((kpi) => ({
      kpiId: kpi._id,
      score: Number(draft.scores[kpi._id]),
      comment: (draft.kpiComments[kpi._id] || '').trim(),
    })),
    comments: draft.comments.trim(),
  }
}

export function reconcileDraft(draft, config) {
  const scores = {}
  const kpiComments = {}

  config.kpis.forEach((kpi) => {
    if (draft.scores[kpi._id] !== undefined) scores[kpi._id] = draft.scores[kpi._id]
    if (draft.kpiComments[kpi._id] !== undefined) {
      kpiComments[kpi._id] = draft.kpiComments[kpi._id]
    }
  })

  const supplierStillActive = config.suppliers.some((supplier) => supplier._id === draft.supplierId)

  return {
    ...draft,
    supplierId: supplierStillActive ? draft.supplierId : '',
    scores,
    kpiComments,
    criteriaSignature: config.criteriaSignature || '',
  }
}
