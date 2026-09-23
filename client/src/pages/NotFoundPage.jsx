import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

export default function NotFoundPage() {
  return (
    <div className="page-container">
      <PageHeader title="Page not found" description="The page you requested does not exist." />
      <section className="surface state-panel">
        <div>
          <FileQuestion className="state-panel__icon" aria-hidden="true" />
          <h2>We could not find that page</h2>
          <p>Check the address or return to the VendorPulse dashboard.</p>
          <Link className="text-link" to="/dashboard">Return to dashboard</Link>
        </div>
      </section>
    </div>
  )
}
