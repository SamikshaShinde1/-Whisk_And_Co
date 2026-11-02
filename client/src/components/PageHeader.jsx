import { motion } from 'motion/react'
import BigWord from './BigWord'
import './PageHeader.css'

// Dark banner at the top of inner pages (Menu, 404, Admin…).
// The page's own title is repeated huge and faint behind it, like a poster.
// "compact" = less height (used on the admin pages, so the orders show sooner).
export default function PageHeader({ script, title, text, compact = false, children }) {
  return (
    <section className={`page-header has-big-word ${compact ? 'page-header--compact' : ''}`}>
      <BigWord word={title} className="page-header__word" speed={40} />
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
