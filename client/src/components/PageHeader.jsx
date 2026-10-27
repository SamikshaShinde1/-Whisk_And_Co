import { motion } from 'motion/react'
import './PageHeader.css'

// Dark banner at the top of inner pages (Menu, 404, Admin…)
export default function PageHeader({ script, title, text, children }) {
  return (
    <section className="page-header">
      <motion.div
        className="container page-header__inner"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {script && <span className="script">{script}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
        {children}
      </motion.div>
    </section>
  )
}
