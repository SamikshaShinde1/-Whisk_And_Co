import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { isSundayInIndia } from '../indiaTime'
import './SundayNotice.css'

const STORAGE_KEY = 'pnp-sunday-seen'

function alreadySeen() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'yes'
  } catch {
    return false
  }
}

// On Sundays (in India), a friendly pop-up once per visit: no same-day orders, but pre-orders are welcome.
// "ready" is false while the intro animation is still playing, so the two don't overlap.
export default function SundayNotice({ ready }) {
  const [open, setOpen] = useState(() => isSundayInIndia() && !alreadySeen())
  const navigate = useNavigate()

  const close = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'yes')
    } catch {
      // storage blocked: it may show again after a refresh, which is fine
    }
    setOpen(false)
  }

  const preorder = () => {
    close()
    navigate('/menu')
  }

  return (
    <Modal open={open && ready} onClose={close} title="Hello, it's Sunday!">
      <div className="sunday-notice">
        <span className="sunday-notice__moon" aria-hidden="true">🌙</span>
        <p>
          We're closed for same-day orders on Sundays. You can still <strong>pre-order for Monday onwards!</strong>
        </p>
        <button type="button" className="btn btn-dark" onClick={preorder}>OK, pre-order</button>
      </div>
    </Modal>
  )
}

// The small reminder used in the cart, at checkout and on the product page
export function SundayNote() {
  if (!isSundayInIndia()) return null
  return (
    <p className="sunday-note" role="note">
      <span aria-hidden="true">🌙</span> Today is Sunday: pre-orders only.
    </p>
  )
}
