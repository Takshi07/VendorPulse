import { ChevronLeft, ChevronRight } from 'lucide-react'

function visiblePages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

export default function Pagination({ page, totalPages, total, label = 'records', onChange }) {
  if (totalPages <= 1) return null

  const pages = visiblePages(page, totalPages)

  return (
    <nav className="pagination" aria-label={`${label} pagination`}>
      <span className="pagination__summary">{total} {label}</span>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__button pagination__button--arrow"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        {pages.map((pageNumber, index) => {
          const previousPage = pages[index - 1]
          return (
            <span className="pagination__item" key={pageNumber}>
              {previousPage && pageNumber - previousPage > 1 ? (
                <span className="pagination__ellipsis" aria-hidden="true">…</span>
              ) : null}
              <button
                type="button"
                className={pageNumber === page ? 'pagination__button is-active' : 'pagination__button'}
                onClick={() => onChange(pageNumber)}
                aria-current={pageNumber === page ? 'page' : undefined}
                aria-label={`Page ${pageNumber}`}
              >
                {pageNumber}
              </button>
            </span>
          )
        })}
        <button
          type="button"
          className="pagination__button pagination__button--arrow"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
