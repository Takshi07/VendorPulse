const ratingDetails = {
  EXCELLENT: { label: 'Excellent', variant: 'excellent' },
  GOOD: { label: 'Good', variant: 'good' },
  NEEDS_IMPROVEMENT: { label: 'Needs Improvement', variant: 'needs-improvement' },
  POOR: { label: 'Poor', variant: 'poor' },
}

export default function RatingBadge({ rating }) {
  const details = ratingDetails[rating] || {
    label: rating || 'Not rated',
    variant: 'neutral',
  }

  return (
    <span className={`rating-badge rating-badge--${details.variant}`}>
      {details.label}
    </span>
  )
}
