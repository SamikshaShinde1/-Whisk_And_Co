import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { FiMenu, FiX } from 'react-icons/fi'
import Logo from './Logo'
import './Navbar.css'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/#about', label: 'About' },
  { to: '#contact', label: 'Contact' }, // the footer, which is on every page
]

// Links with "#" jump to a section; the others are full pages (NavLink marks the current one).
function NavItem({ link, onClick }) {
  if (link.to.includes('#')) {
    return <Link to={link.to} onClick={onClick}>{link.label}</Link>
  }
  return <NavLink to={link.to} end={link.to === '/'} onClick={onClick}>{link.label}</NavLink>
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const close = () => setOpen(false)

  // Add a shadow once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Logo onClick={close} />

        <nav className="navbar__links" aria-label="Main">
          {LINKS.map((link) => (
            <NavItem key={link.label} link={link} />
          ))}
        </nav>

        <Link to="/menu" className="btn btn-rose navbar__cta">Order now</Link>

        <button
          className="navbar__toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            className="navbar__mobile"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div className="container navbar__mobile-inner">
              {LINKS.map((link) => (
                <NavItem key={link.label} link={link} onClick={close} />
              ))}
              <Link to="/menu" className="btn btn-rose" onClick={close}>Order now</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
