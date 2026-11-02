import { FiLock } from 'react-icons/fi'

// The small promise under every form that asks for the customer's name or phone number
export default function PrivacyNote() {
  return (
    <p className="privacy-note">
      <FiLock aria-hidden="true" /> We only use your details to prepare and deliver your order.
    </p>
  )
}
