import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'
import { SITE } from '../config/site'

// The round logo + "Whisk & Co." (with a script "&"), links back to the Home page.
export default function Logo({ onClick, size = 44 }) {
  return (
    <Link to="/" onClick={onClick} aria-label={`${SITE.name} – home`} className="logo">
      <LogoMark size={size} />
      <span className="logo__name">
        Whisk<span className="logo__amp">&amp;</span>Co.
      </span>
    </Link>
  )
}
