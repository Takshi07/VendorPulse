import { PanelsTopLeft } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="page-container">
      <PageHeader title={title} description={description} />
      <section className="surface placeholder-card" aria-label={`${title} implementation status`}>
        <div className="placeholder-card__inner">
          <span className="placeholder-card__icon">
            <PanelsTopLeft aria-hidden="true" />
          </span>
          <h2>Foundation ready</h2>
          <p>
            This route is protected and connected to the shared VendorPulse shell. Its live data and
            screen-specific interactions will be added in the corresponding frontend phase.
          </p>
        </div>
      </section>
    </div>
  )
}
