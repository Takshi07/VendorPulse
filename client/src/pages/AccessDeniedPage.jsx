import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

export default function AccessDeniedPage() {
  return (
    <div className="page-container">
      <PageHeader title="Access denied" description="Your role does not allow access to this page." />
      <section className="surface state-panel">
        <div>
          <ShieldX className="state-panel__icon" aria-hidden="true" />
          <h2>Permission required</h2>
          <p>Use the navigation to return to an area available to your VendorPulse role.</p>
          <Link className="text-link" to="/dashboard">Return to dashboard</Link>
        </div>
      </section>
    </div>
  )
}
