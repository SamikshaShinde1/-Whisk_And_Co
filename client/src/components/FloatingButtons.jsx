import { motion } from 'motion/react'
import { FaInstagram, FaWhatsapp } from 'react-icons/fa'
import { SITE, whatsappLink } from '../config/site'
import './FloatingButtons.css'

const BUTTONS = [
  { className: 'float-btn--instagram', href: SITE.instagramUrl, label: 'Follow us on Instagram', icon: <FaInstagram /> },
  { className: 'float-btn--whatsapp', href: whatsappLink(), label: 'Order on WhatsApp', icon: <FaWhatsapp /> },
]

// Round Instagram + WhatsApp buttons that float in the bottom-right corner of every page.
export default function FloatingButtons() {
  return (
    <div className="float-btns">
      {BUTTONS.map((button, i) => (
        <motion.a
          key={button.className}
          className={`float-btn ${button.className}`}
          href={button.href}
          target="_blank"
          rel="noreferrer"
          aria-label={button.label}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 + i * 0.15, type: 'spring', stiffness: 260, damping: 18 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          {button.icon}
          <span className="float-btn__label">{button.label}</span>
        </motion.a>
      ))}
    </div>
  )
}
