import { useEffect } from 'react'
import { motion } from 'motion/react'
import LogoMark from './LogoMark'
import { SITE } from '../config/site'
import './Intro.css'

const INTRO_LENGTH_MS = 3800

// Little sparkles that pop around the logo: [left %, top %, size px, delay s]
const SPARKLES = [
  [8, 14, 22, 2.05],
  [90, 22, 16, 2.15],
  [84, 82, 20, 2.25],
  [12, 76, 14, 2.35],
]

// A four-pointed sparkle
function Sparkle({ x, y, size, delay }) {
  return (
    <motion.svg
      className="intro__sparkle"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, rotate: -45, opacity: 0 }}
      animate={{ scale: [0, 1.25, 1], rotate: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" />
    </motion.svg>
  )
}

// The opening: the logo builds itself (circle, chocolate W, the whisk draws itself line by line
// and gives a little "whisk" wiggle, drips run down), sparkles pop, then the name fades in.
// Click, tap or press a key to skip.
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
        {/* 1. The logo builds itself, with sparkles around it */}
        <div className="intro__logo">
          <LogoMark size={160} animate />
          {SPARKLES.map(([x, y, size, delay]) => (
            <Sparkle key={`${x}-${y}`} x={x} y={y} size={size} delay={delay} />
          ))}
        </div>

        {/* 2. Then the name fades in */}
        <motion.h1
          className="intro__name logo__name"
          aria-label={SITE.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.6, ease: 'easeOut' }}
        >
          <span aria-hidden="true">
            Whisk<span className="logo__amp">&amp;</span>Co.
          </span>
        </motion.h1>

        {/* 3. Small handwritten line */}
        <motion.p
          className="intro__tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.9, duration: 0.6 }}
        >
          baked with love
        </motion.p>
      </motion.div>

      <span className="intro__skip">Tap to skip</span>
    </motion.div>
  )
}
