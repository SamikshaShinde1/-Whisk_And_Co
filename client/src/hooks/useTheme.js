import { useEffect, useState } from 'react'

// Light and dark mode.
// The user's choice ('light', 'dark' or 'system') is saved in this browser.
// 'system' (the default) follows the phone or computer's own setting.
// index.html has a tiny copy of these rules that runs before React, so the page never flashes the wrong colour.

const STORAGE_KEY = 'pnp-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'
const BAR_COLOURS = { light: '#3b2420', dark: '#1c110f' } // the phone's browser bar, same as the navbar

function getSavedChoice() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system' // storage can be blocked, e.g. in some private windows
  }
}

function saveChoice(choice) {
  try {
    if (choice === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // not saved, but the switch still works until the page is closed
  }
}

// Put the theme on <html data-theme="...">; the colours in index.css follow it
function applyTheme(theme) {
  const root = document.documentElement
  if (root.dataset.theme === theme) return

  // Fade the colours for a moment, unless the user prefers less motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-fade')
    setTimeout(() => root.classList.remove('theme-fade'), 450)
  }
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOURS[theme])
}

export default function useTheme() {
  const [choice, setChoice] = useState(getSavedChoice)
  const [deviceDark, setDeviceDark] = useState(() => window.matchMedia(DARK_QUERY).matches)

  // Notice when the device switches (for example, phones that go dark at sunset)
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const onChange = (event) => setDeviceDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  // The theme actually shown: the user's choice, or the device's setting for 'system'
  const theme = choice === 'system' ? (deviceDark ? 'dark' : 'light') : choice

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const changeChoice = (next) => {
    saveChoice(next)
    setChoice(next)
  }

  return { choice, theme, changeChoice }
}
