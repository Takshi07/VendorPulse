import { Link } from 'react-router-dom'
import logo from '../assets/brand/vendorpulse-logo.png'

export default function Brand({ linkTo = '/dashboard' }) {
  const content = (
    <>
      <img className="brand__mark" src={logo} alt="" />
      <span className="brand__name">
        Vendor<span className="brand__name-accent">Pulse</span>
      </span>
    </>
  )

  if (!linkTo) return <div className="brand">{content}</div>

  return (
    <Link className="brand" to={linkTo} aria-label="VendorPulse dashboard">
      {content}
    </Link>
  )
}
