import { motion } from 'motion/react'

// Wrap anything in <Reveal> to make it gently fade up when it scrolls into view.
// "x" makes it slide in from the side instead (e.g. x={-60} comes from the left), used for photos.
export default function Reveal({ children, delay = 0, y = 40, x = 0, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: x ? 0 : y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: x ? 0.9 : 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
