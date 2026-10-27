import { useEffect } from 'react'
import { motion } from 'motion/react'
import LogoMark from './LogoMark'
import { SITE } from '../config/site'
import './Intro.css'

const INTRO_LENGTH_MS = 3000

// Netflix-style opening: the logo zooms in, the name appears letter by letter,
// then everything fades into the website. Click, tap or press a key to skip.
export default function Intro({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, INTRO_LENGTH_MS)
    window.addEventListener('keydown', onDone)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onDone)
    }
  }, [onDone])

  return (
    <motion.div
      className="intro"
      onClick={onDone}
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
      exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } }}
    >
      <motion.div
        className="intro__content"
        exit={{ scale: 1.25, filter: 'blur(6px)', transition: { duration: 0.7, ease: 'easeIn' } }}
      >
        {/* 1. Logo zooms in with a warm glow */}
        <motion.div
          className="intro__logo"
          initial={{ scale: 0.2, opacity: 0, filter: 'blur(12px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <LogoMark size={128} />
        </motion.div>

        {/* 2. Name appears letter by letter */}
        <h1 className="intro__name" aria-label={SITE.name}>
          {SITE.name.split('').map((letter, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.055, duration: 0.4, ease: 'easeOut' }}
            >
              {letter === ' ' ? ' ' : letter}
            </motion.span>
          ))}
        </h1>

        {/* 3. Small handwritten line */}
        <motion.p
          className="intro__tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.6 }}
        >
          baked with love
        </motion.p>
      </motion.div>

      <span className="intro__skip">Tap to skip</span>
    </motion.div>
  )
}
