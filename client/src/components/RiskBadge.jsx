const riskDetails = {
  LOW: { label: 'Low', variant: 'low' },
  MODERATE: { label: 'Moderate', variant: 'moderate' },
  HIGH: { label: 'High', variant: 'high' },
  CRITICAL: { label: 'Critical', variant: 'critical' },
}

export default function RiskBadge({ risk }) {
  const details = riskDetails[risk] || {
    label: risk || 'Unknown',
    variant: 'neutral',
  }

  return <span className={`risk-badge risk-badge--${details.variant}`}>{details.label}</span>
}
