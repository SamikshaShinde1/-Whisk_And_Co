import { useEffect, useRef, useState } from 'react'
import { FiCheck, FiMonitor, FiMoon, FiSun } from 'react-icons/fi'
import useTheme from '../hooks/useTheme'
import './ThemeToggle.css'

const OPTIONS = [
  { id: 'light', label: 'Light', Icon: FiSun },
  { id: 'dark', label: 'Dark', Icon: FiMoon },
  { id: 'system', label: 'System', Icon: FiMonitor },
]

// The sun / moon button in the navbar. Tapping it opens a small menu: Light, Dark or System.
export default function ThemeToggle() {
  const { choice, theme, changeChoice } = useTheme()
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  // Close the menu when the user taps somewhere else or presses Esc
  useEffect(() => {
    if (!open) return
    const onPointer = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (id) => {
    changeChoice(id)
    setOpen(false)
  }

  const Icon = theme === 'dark' ? FiMoon : FiSun
  const current = OPTIONS.find((option) => option.id === choice).label

  return (
    <div className="theme" ref={boxRef}>
      <button
        type="button"
        className="theme__button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Colour theme: ${current}`}
        title="Light or dark mode"
      >
        {/* the key makes the icon spin in again whenever the theme changes */}
        <Icon key={theme} className="theme__icon" aria-hidden="true" />
      </button>

      {open && (
        <div className="theme__menu" role="group" aria-label="Colour theme">
          {OPTIONS.map(({ id, label, Icon: OptionIcon }) => (
            <button
              key={id}
              type="button"
              className={`theme__option ${choice === id ? 'is-active' : ''}`}
              onClick={() => pick(id)}
              aria-pressed={choice === id}
            >
              <OptionIcon aria-hidden="true" />
              {label}
              {choice === id && <FiCheck className="theme__check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
