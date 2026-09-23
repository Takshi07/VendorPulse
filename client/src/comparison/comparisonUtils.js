export function validateComparison({ supplierIds, year, quarter }) {
  const errors = {}

  if (supplierIds.length < 2 || supplierIds.length > 3) {
    errors.suppliers = 'Select exactly 2 or 3 suppliers.'
  } else if (new Set(supplierIds).size !== supplierIds.length) {
    errors.suppliers = 'Each supplier can be selected only once.'
  }

  if (year === '' || !Number.isInteger(Number(year))) {
    errors.year = 'Enter a valid year.'
  }

  if (![1, 2, 3, 4].includes(Number(quarter))) {
    errors.quarter = 'Select a quarter.'
  }

  return errors
}

export function comparisonErrorMessage(error, suppliers, year, quarter) {
  if (error?.code === 'MISSING_EVALUATION') {
    const names = (error.details?.missingSupplierIds || [])
      .map((id) => suppliers.find((supplier) => supplier._id === id)?.supplierName || 'A selected supplier')
    const supplierList = names.join(', ') || 'One or more selected suppliers'
    return `${supplierList} does not have an evaluation for Q${quarter} ${year}. Choose another supplier or period.`
  }

  if (error?.code === 'INCOMPATIBLE_CRITERIA') {
    return 'The selected evaluations use different KPI criteria and cannot be compared. Choose evaluations from a compatible period.'
  }

  return error?.message || 'Unable to compare these suppliers. Check your connection and try again.'
}
