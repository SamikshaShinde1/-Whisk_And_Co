import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiX } from 'react-icons/fi'
import SmartImage from '../SmartImage'
import { formatPrice, getCategory, hasOffer } from '../../data/menu'
import useCart, { MAX_NOTE, MAX_QTY, useCartDetails } from '../../hooks/useCart'
import { SundayNote } from '../SundayNotice'
import '../Modal.css' // the round ✕ button
import '../OrderPanel.css' // the quantity buttons
import './CartDrawer.css'

// The cart panel that slides in from the right.
// Built on the browser's <dialog>, like Modal: Esc closes it and keyboard focus stays inside.
export default function CartDrawer() {
  const { isOpen, closeCart, updateLine, removeLine, count } = useCart()
  const { items, total, hasProblems } = useCartDetails()
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  // Clicking the dark area outside the panel closes it
  const onClick = (event) => event.target === dialogRef.current && closeCart()

  return (
    <dialog ref={dialogRef} className="cart-drawer" onClose={closeCart} onClick={onClick} aria-labelledby="cart-title">
      {isOpen && (
        <div className="cart-drawer__panel">
          <header className="cart-drawer__head">
            <h2 id="cart-title">
              Your cart {count > 0 && <span>({count})</span>}
            </h2>
            <button type="button" className="modal__close" onClick={closeCart} aria-label="Close cart">
              <FiX />
            </button>
          </header>

          {items.length === 0 ? (
            // ---------- Empty cart ----------
            <div className="cart-drawer__empty">
              <FiShoppingBag className="cart-drawer__empty-icon" aria-hidden="true" />
              <h3>Your cart is empty</h3>
              <p>Add a treat or two and it will wait for you here.</p>
              <Link to="/menu" className="btn btn-dark" onClick={closeCart}>Browse menu</Link>
            </div>
          ) : (
            <>
              <ul className="cart-drawer__list">
                {items.map((item) => {
                  const product = item.product
                  const category = getCategory(product?.category)
                  const isCake = product?.category === 'cakes'
                  return (
                    <li key={item.id} className={`cart-line ${item.problem ? 'has-problem' : ''}`}>
                      <Link to={`/menu/${item.slug}`} className={`cart-line__photo ${item.problem ? 'is-soldout' : ''}`} onClick={closeCart} tabIndex={-1}>
                        <SmartImage src={product?.image} alt="" emoji={category.emoji} tone={category.tone} />
                      </Link>

                      <div className="cart-line__info">
                        <div className="cart-line__top">
                          <Link to={`/menu/${item.slug}`} className="cart-line__name" onClick={closeCart}>
                            {product?.name || 'Removed item'}
                          </Link>
                          <strong className="cart-line__total">{item.problem ? '–' : formatPrice(item.lineTotal)}</strong>
                        </div>

                        {item.problem ? (
                          <span className="soldout-badge">{item.problem}</span>
                        ) : (
                          <small className="cart-line__each">
                            {formatPrice(item.unitPrice)} each · {product?.unit}
                            {hasOffer(product) && <span className="cart-line__offer"> ✨ {product.specialTag}</span>}
                          </small>
                        )}

                        <div className="cart-line__controls">
                          {!item.problem && (
                            <div className="qty qty--small" role="group" aria-label={`Quantity of ${product?.name}`}>
                              <button type="button" onClick={() => updateLine(item.id, { qty: item.qty - 1 })} disabled={item.qty <= 1} aria-label="Decrease quantity">
                                <FiMinus />
                              </button>
                              <span aria-live="polite">{item.qty}</span>
                              <button type="button" onClick={() => updateLine(item.id, { qty: item.qty + 1 })} disabled={item.qty >= MAX_QTY} aria-label="Increase quantity">
                                <FiPlus />
                              </button>
                            </div>
                          )}
                          <button type="button" className="cart-line__remove" onClick={() => removeLine(item.id)} aria-label={`Remove ${product?.name || 'item'}`}>
                            <FiTrash2 /> Remove
                          </button>
                        </div>

                        {!item.problem && (
                          <input
                            className="cart-line__note"
                            value={item.note}
                            onChange={(event) => updateLine(item.id, { note: event.target.value })}
                            maxLength={MAX_NOTE}
                            placeholder={isCake ? 'Message on cake (optional)' : 'Note (optional)'}
                            aria-label={`${isCake ? 'Message on cake' : 'Note'} for ${product?.name}`}
                          />
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              <footer className="cart-drawer__foot">
                <SundayNote />
                <div className="cart-drawer__total">
                  <span>Total</span>
                  <strong>{formatPrice(total)}</strong>
                </div>
                {hasProblems ? (
                  <p className="cart-drawer__warning" role="alert">Please remove the sold-out items to continue.</p>
                ) : (
                  <Link to="/checkout" className="btn btn-dark cart-drawer__checkout" onClick={closeCart}>
                    Checkout · {formatPrice(total)}
                  </Link>
                )}
                <button type="button" className="cart-drawer__continue" onClick={closeCart}>Continue shopping</button>
              </footer>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
