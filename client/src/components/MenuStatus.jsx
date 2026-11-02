import { FiRefreshCw } from 'react-icons/fi'
import './MenuStatus.css'

// Grey "shimmer" cards shaped like ProductCard, shown while the menu loads.
// Put them inside the same grid the real cards use.
export function LoadingCards({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-card__photo" />
      <div className="skeleton-card__body">
        <div className="skeleton skeleton-line skeleton-line--short" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line--price" />
      </div>
    </div>
  ))
}

// The message under the shimmer. If the server is asleep, WakeUpNotice adds "Waking up the oven…".
export function LoadingNote() {
  return (
    <p className="menu-status" role="status">
      Loading the menu…
    </p>
  )
}

// Shown when the menu could not be loaded
export function LoadError({ message, onRetry }) {
  return (
    <div className="menu-status menu-status--error" role="alert">
      <p>{message || 'We could not load the menu.'}</p>
      <button type="button" className="btn btn-dark" onClick={onRetry}>
        <FiRefreshCw /> Try again
      </button>
    </div>
  )
}
