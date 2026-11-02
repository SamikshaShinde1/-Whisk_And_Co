import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { FiMinus, FiPlus, FiShoppingBag, FiZap } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { formatPrice, priceNow } from '../data/menu'
import { orderMessage } from '../orderMessage'
import { whatsappLink } from '../config/site'
import useCart, { MAX_LINES, MAX_NOTE, MAX_QTY } from '../hooks/useCart'
import { SundayNote } from './SundayNotice'
import './OrderPanel.css'

// On the product page: choose how many and a note, then "Add to cart", "Buy now" or order on WhatsApp.
// The customer's details (name, phone, date…) are asked once, at checkout, for the whole cart.
export default function OrderPanel({ item }) {
  const { addItem, openCart } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const total = priceNow(item) * qty // the offer price during a special (the server checks it again)
  const isCake = item.category === 'cakes'
  const noteLabel = isCake ? 'Message on cake' : 'Special note'

  // Puts this item in the cart. Returns false if the cart is full.
  const add = () => {
    if (!addItem(item.slug, qty, note)) {
      setError(`Your cart is full (${MAX_LINES} different items). Please check out first.`)
      return false
    }
    setError('')
    setQty(1)
    setNote('')
    return true
  }

  const addToCart = () => add() && openCart()
  const buyNow = () => add() && navigate('/checkout')

  const whatsappMessage = orderMessage({
    items: [{ name: item.name, unit: item.unit, qty, lineTotal: total, note }],
    total,
  })

  return (
    <div className="order">
      <SundayNote />
      <div className="order__row">
        <div>
          <span className="order__label" id="qty-label">Quantity</span>
          <div className="qty" role="group" aria-labelledby="qty-label">
            <button type="button" onClick={() => setQty(qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity">
              <FiMinus />
            </button>
            <span aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty(qty + 1)} disabled={qty >= MAX_QTY} aria-label="Increase quantity">
              <FiPlus />
            </button>
          </div>
        </div>
        <div className="order__total">
          <span className="order__label">Total</span>
          <motion.strong key={total} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {formatPrice(total)}
          </motion.strong>
        </div>
      </div>

      <label className="field">
        <span>{noteLabel} <em>(optional)</em></span>
        <textarea
          rows={2}
          maxLength={MAX_NOTE}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={isCake ? 'e.g. Happy Birthday Riya!' : 'e.g. less sugar, gift wrap…'}
        />
      </label>

      {error && <p className="order__error" role="alert">{error}</p>}

      <div className="order__actions">
        <button type="button" className="btn btn-dark" onClick={addToCart}>
          <FiShoppingBag /> Add to cart
        </button>
        <button type="button" className="btn btn-rose" onClick={buyNow}>
          <FiZap /> Buy now
        </button>
      </div>
      <a href={whatsappLink(whatsappMessage)} target="_blank" rel="noreferrer" className="btn btn-whatsapp order__whatsapp">
        <FaWhatsapp /> Order on WhatsApp
      </a>
      <p className="order__hint">We confirm every order personally. Payment on confirmation.</p>
    </div>
  )
}
