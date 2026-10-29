import { useEffect, useId, useRef } from 'react'
import { FiX } from 'react-icons/fi'
import './Modal.css'

// A pop-up window, built on the browser's own <dialog>.
// It keeps keyboard focus inside, and closes with the Esc key or the ✕ button.
export default function Modal({ open, onClose, title, children, size = 'normal' }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  // Open or close the real <dialog> when "open" changes
  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className={`modal modal--${size}`} onClose={onClose} aria-labelledby={titleId}>
      {open && (
        <>
          <header className="modal__head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              <FiX />
            </button>
          </header>
          <div className="modal__body">{children}</div>
        </>
      )}
    </dialog>
  )
}
