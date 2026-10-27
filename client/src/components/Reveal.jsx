import { motion } from 'motion/react'

// Wrap anything in <Reveal> to make it gently fade up when it scrolls into view.
export default function Reveal({ children, delay = 0, y = 40, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
