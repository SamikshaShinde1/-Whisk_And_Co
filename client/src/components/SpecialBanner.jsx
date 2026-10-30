import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { FiArrowRight, FiX } from 'react-icons/fi'
import useSpecials from '../hooks/useSpecials'
import './SpecialBanner.css'

const STORAGE_KEY = 'pnp-banner-closed'

// Remembers (for this visit only) which offers the banner was closed for.
// If the bakery adds a new special, the banner comes back.
function readClosed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

// The festive strip under the navbar: "✨ Diwali Specials are here!"
// Shown only while a special is running; the visitor can close it.
export default function SpecialBanner() {
  const { specials, title } = useSpecials()
  const [closed, setClosed] = useState(readClosed)
  const signature = specials.map((item) => item.slug).join(',')

  const close = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, signature)
    } catch {
      // storage blocked: the banner just stays closed until the page is refreshed
    }
    setClosed(signature)
  }

  const show = specials.length > 0 && closed !== signature

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.aside
          className="special-banner"
          aria-label="Special offers"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <div className="container special-banner__inner">
            <p>
              <span aria-hidden="true">✨ </span>
              <strong>
                {title} {title.endsWith('s') ? 'are' : 'is'} here!
              </strong>
              <span className="special-banner__extra"> Limited-time festive treats.</span>
            </p>
            <Link to="/#specials" className="special-banner__link">
              See offers <FiArrowRight aria-hidden="true" />
            </Link>
            <button type="button" className="special-banner__close" onClick={close} aria-label="Close the offers banner">
              <FiX />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
