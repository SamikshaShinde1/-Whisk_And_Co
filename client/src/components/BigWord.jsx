import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

// A huge decorative word behind a section, e.g. "COOKIES" (always a word that is already on the page).
// It drifts a little slower than the page while scrolling (parallax), which gives depth.
// Screen readers skip it (aria-hidden): the real heading is always written elsewhere.
// The parent needs the has-big-word class (position: relative + clipped edges).
// It is a <span> (not a <p>), so paragraph styles of the section can't change its size.
export default function BigWord({ word, className = '', speed = 70 }) {
  const ref = useRef(null)
  const calm = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed])

  if (!word) return null
  return (
    <motion.span
      ref={ref}
      className={`bg-word big-word ${className}`}
      style={{ '--len': Math.max(word.length, 5), ...(calm ? {} : { y }) }}
      aria-hidden="true"
    >
      {word}
    </motion.span>
  )
}
