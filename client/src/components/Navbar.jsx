import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { FiMenu, FiX } from 'react-icons/fi'
import Logo from './Logo'
import CartButton from './cart/CartButton'
import './Navbar.css'

// The navbar is kept short on purpose: Logo · Home · Menu · Track order · Order now · Cart.
// Everything else (Our story, Contact, light/dark mode) is in the footer.
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const close = () => setOpen(false)
  const isAdmin = useLocation().pathname.startsWith('/admin') // no shopping cart on admin pages

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
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/track">Track order</NavLink>
        </nav>

        <Link to="/menu" className="btn btn-rose navbar__cta">Order now</Link>

        {!isAdmin && <CartButton />}

        {/* Phones: a menu button instead of the links */}
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
              <NavLink to="/" end onClick={close}>Home</NavLink>
              <NavLink to="/menu" onClick={close}>Menu</NavLink>
              <NavLink to="/track" onClick={close}>Track order</NavLink>
              <Link to="/menu" className="btn btn-rose" onClick={close}>Order now</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
