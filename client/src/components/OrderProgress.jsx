import { motion } from 'motion/react'
import { FaClipboardList, FaFire, FaGift, FaCheck } from 'react-icons/fa'
import './OrderProgress.css'

// The 4 steps, in order. "status" must match ORDER_STATUSES in server/models/Order.js
const STEPS = [
  { status: 'new', label: 'Received', icon: <FaClipboardList /> },
  { status: 'baking', label: 'Baking', icon: <FaFire /> },
  { status: 'ready', label: 'Ready', icon: <FaGift /> },
  { status: 'delivered', label: 'Delivered', icon: <FaCheck /> },
]

// Friendly sentence for each status
function statusMessage(status, deliveryType) {
  const pickup = deliveryType !== 'delivery'
  switch (status) {
    case 'baking':
      return 'Your order is in the oven right now! 🔥'
    case 'ready':
      return pickup ? 'Your order is ready for pickup! 🎁' : 'Your order is ready and will be on its way soon! 🎁'
    case 'delivered':
      return pickup ? 'Picked up – enjoy every bite! 💛' : 'Delivered – enjoy every bite! 💛'
    default:
      return 'We have received your order and will start baking soon.'
  }
}

// Progress bar: Received → Baking → Ready → Delivered
export default function OrderProgress({ status, deliveryType }) {
  const current = Math.max(0, STEPS.findIndex((step) => step.status === status))

  return (
    <div className="progress">
      <p className="progress__message" role="status">{statusMessage(status, deliveryType)}</p>

      <div className="progress__bar">
        {/* grey line behind the steps, and the coloured part that grows */}
        <div className="progress__track" aria-hidden="true">
          <motion.div
            className="progress__fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: current / (STEPS.length - 1) }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>

        <ol className="progress__steps" aria-label="Order progress">
          {STEPS.map((step, i) => {
            const state = i < current ? 'done' : i === current ? 'current' : 'todo'
            return (
              <li key={step.status} className={`progress__step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <motion.span
                  className="progress__dot"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 * i, type: 'spring', stiffness: 260, damping: 18 }}
                >
                  {state === 'done' ? <FaCheck /> : step.icon}
                </motion.span>
                <span className="progress__label">{step.label}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
