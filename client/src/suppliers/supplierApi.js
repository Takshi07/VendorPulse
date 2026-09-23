import { api } from '../api/client.js'

export async function loadAllSuppliers(signal) {
  const firstPage = await api.get('/suppliers', { query: { page: 1, limit: 100 }, signal })
  if (firstPage.pagination.totalPages <= 1) return firstPage.suppliers

  const remaining = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) => (
      api.get('/suppliers', { query: { page: index + 2, limit: 100 }, signal })
    )),
  )

  return [firstPage, ...remaining]
    .flatMap((response) => response.suppliers)
    .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
}
