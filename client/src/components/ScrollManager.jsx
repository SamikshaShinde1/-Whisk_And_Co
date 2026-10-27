import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// After every page change: scroll to a section (e.g. /#about) or back to the top.
// Navigations that pass state { keepScroll: true } (like the menu filters) stay where they are.
export default function ScrollManager() {
  const { pathname, hash, key, state } = useLocation()

  useEffect(() => {
    if (state?.keepScroll) return

    if (hash) {
      const section = document.getElementById(hash.slice(1))
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash, key, state])

  return null
}
