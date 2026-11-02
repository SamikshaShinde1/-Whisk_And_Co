import { useId } from 'react'
import { motion } from 'motion/react'
import { DRIPS, MARK_TRANSFORM, SHINE, W_PATH, WIRES } from './logo/logoShapes'
import './LogoMark.css'

// The round Whisk & Co. logo: whisk wires dipping into a chocolate "W", on a blush circle.
// It is drawn right in the page (not an <img>), so its colours follow light and dark mode
// (the --logo-* colours in index.css). The shapes come from scripts/make-logo.mjs.
//
// With animate, it builds itself step by step (used by the intro):
// circle → W drops in → wires draw themselves → a little whisk wiggle → drips run down.
export default function LogoMark({ size = 44, className = '', animate = false }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const choc = `url(#choc-${id})`

  // Animation settings only when animate is on; otherwise everything is simply drawn
  const step = (initial, target, transition) => (animate ? { initial, animate: target, transition } : {})

  return (
    <svg className={`logo-mark ${className}`} viewBox="0 0 300 300" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={`choc-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="250">
          <stop offset="0" style={{ stopColor: 'var(--logo-choc-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-choc-bottom)' }} />
        </linearGradient>
        <clipPath id={`disc-${id}`}>
          <circle cx="150" cy="150" r="140" />
        </clipPath>
      </defs>

      <motion.circle
        className="logo-mark__disc"
        cx="150"
        cy="150"
        r="140"
        {...step({ scale: 0 }, { scale: 1 }, { duration: 0.5, ease: [0.3, 1.4, 0.5, 1] })}
      />

      <g clipPath={`url(#disc-${id})`}>
        <g transform={MARK_TRANSFORM}>
          <motion.path d={W_PATH} fill={choc} {...step({ opacity: 0, y: -40 }, { opacity: 1, y: 0 }, { delay: 0.35, duration: 0.5, ease: 'easeOut' })} />

          {/* drips run down from the W */}
          <motion.g style={{ originY: 0 }} {...step({ scaleY: 0 }, { scaleY: 1 }, { delay: 2, duration: 0.5, ease: 'easeIn' })}>
            {DRIPS.map(({ d, bulb }) => (
              <g key={d} fill={choc}>
                <path d={d} />
                <circle cx={bulb.cx} cy={bulb.cy} r={bulb.r} />
              </g>
            ))}
          </motion.g>

          {/* the whisk: wires draw themselves, get their chocolate coat, then give a little wiggle */}
          <motion.g
            fill="none"
            strokeLinecap="round"
            style={{ originX: 1, originY: 1 }}
            {...step({ rotate: 0 }, { rotate: [0, -9, 7, -3, 0] }, { delay: 1.45, duration: 0.6, ease: 'easeInOut' })}
          >
            {WIRES.map(({ wire }, i) => (
              <motion.path
                key={wire}
                className="logo-mark__wire"
                d={wire}
                strokeWidth="2.2"
                {...step({ pathLength: 0 }, { pathLength: 1 }, { delay: 0.75 + i * 0.07, duration: 0.5, ease: 'easeOut' })}
              />
            ))}
            {WIRES.map(({ coat }, i) => (
              <motion.path
                key={coat}
                d={coat}
                stroke={choc}
                strokeWidth="5"
                {...step({ pathLength: 0 }, { pathLength: 1 }, { delay: 1.15 + i * 0.05, duration: 0.3 })}
              />
            ))}
          </motion.g>

          <motion.path
            className="logo-mark__shine"
            d={SHINE}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            {...step({ opacity: 0 }, { opacity: 1 }, { delay: 2.2, duration: 0.4 })}
          />
        </g>
      </g>
    </svg>
  )
}
