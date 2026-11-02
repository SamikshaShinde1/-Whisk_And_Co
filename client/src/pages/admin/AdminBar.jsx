import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMoreHorizontal } from 'react-icons/fi'
import LogoMark from '../../components/LogoMark'
import { SITE } from '../../config/site'
import './AdminBar.css'

// The slim bar at the top of the admin pages (instead of the big banner and the site navbar).
// Left: small logo + page title. Right: small round icon buttons.
// On phones the buttons fold into a "⋯" menu.
// Each action is { label, Icon, onClick } or { label, Icon, to } for a link,
// plus optional: className (for its hover animation), active, disabled.
export default function AdminBar({ title, subtitle, actions }) {
  const [open, setOpen] = useState(false)
  const moreRef = useRef(null)

  // Close the "⋯" menu when the user taps somewhere else or presses Esc
  useEffect(() => {
    if (!open) return
    const onPointer = (event) => {
      if (!moreRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // One action, drawn as an icon button (wide screens) or as a row in the "⋯" menu (phones)
  const renderAction = (action, inMenu) => {
    const { label, Icon, to, onClick, className = '', active, disabled } = action
    const look = inMenu
      ? `admin-bar__item ${active ? 'is-active' : ''}`
      : `admin-bar__tool ${className} ${active ? 'is-active' : ''}`
    const content = (
      <>
        <Icon aria-hidden="true" />
        {inMenu && label}
      </>
    )
    const props = {
      className: look,
      title: inMenu ? undefined : label,
      'aria-label': inMenu ? undefined : label,
    }

    if (to) return <Link key={label} {...props} to={to} onClick={() => setOpen(false)}>{content}</Link>
    return (
      <button
        key={label}
        {...props}
        type="button"
        disabled={disabled}
        aria-pressed={active === undefined ? undefined : active}
        onClick={() => {
          setOpen(false)
          onClick()
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <header className="admin-bar">
      <div className="container admin-bar__inner">
        <Link to="/" className="admin-bar__home" aria-label={`${SITE.name} – website`}>
          <LogoMark size={32} />
        </Link>
        <div className="admin-bar__title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="admin-bar__tools">{actions.map((action) => renderAction(action, false))}</div>

        <div className="admin-bar__more" ref={moreRef}>
          <button
            type="button"
            className="admin-bar__tool"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="More actions"
          >
            <FiMoreHorizontal aria-hidden="true" />
          </button>
          {open && (
            <div className="admin-bar__menu" role="group" aria-label="Actions">
              {actions.map((action) => renderAction(action, true))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
