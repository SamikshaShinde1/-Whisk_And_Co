import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'
import { SITE } from '../config/site'

// Logo picture + bakery name, links back to the Home page.
export default function Logo({ onClick, size = 44 }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label={`${SITE.name} – home`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}
    >
      <LogoMark size={size} />
      <span className="logo__name" style={{ fontFamily: 'var(--font-head)', lineHeight: 1 }}>{SITE.name}</span>
    </Link>
  )
}
