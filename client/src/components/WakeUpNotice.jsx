import { useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { isServerSlow, subscribeToServerSlow } from '../api'
import './WakeUpNotice.css'

// A small friendly message at the bottom of the screen while the server is slow to answer
// (the free server sleeps when nobody visits for 15 minutes). It goes away by itself.
export default function WakeUpNotice() {
  const slow = useSyncExternalStore(subscribeToServerSlow, isServerSlow)

  return (
    // The live region is always there, so screen readers announce the message when it appears
    <div className="wake-up" role="status" aria-live="polite">
      <AnimatePresence>
        {slow && (
          <motion.p
            className="wake-up__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <span className="wake-up__oven" aria-hidden="true">🧁</span>
            <span>
              <strong>Waking up the oven…</strong>
              <small>Our server naps when it's quiet. The first visit can take up to a minute.</small>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
