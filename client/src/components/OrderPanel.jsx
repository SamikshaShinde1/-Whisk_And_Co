import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { FiMinus, FiPlus, FiCheckCircle, FiCopy, FiCheck, FiMapPin } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { createOrder } from '../api'
import { rememberOrder } from '../recentOrders'
import { formatPrice, priceNow } from '../data/menu'
import { SITE, whatsappLink } from '../config/site'
import './OrderPanel.css'

const MAX_QTY = 50

// Today's date as "YYYY-MM-DD" (local time), used as the earliest date you can pick.
function today() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

const EMPTY_FORM = { customerName: '', phone: '', deliveryType: 'pickup', address: '', date: '' }

// Quantity, live total, note, order form and the "Order on WhatsApp" button for one menu item.
export default function OrderPanel({ item }) {
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [copied, setCopied] = useState(false)

  const total = priceNow(item) * qty // the offer price during a special (the server checks it again)
  const isCake = item.category === 'cakes'
  const noteLabel = isCake ? 'Message on cake' : 'Special note'

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  // Same order, written as a WhatsApp message (with the order number once the order is placed)
  const whatsappMessage = [
    orderNumber ? `Hi ${SITE.name}! I just placed order ${orderNumber}:` : `Hi ${SITE.name}! I'd like to order:`,
    `• ${item.name} (${item.unit}) × ${qty} = ${formatPrice(total)}`,
    note && `${noteLabel}: ${note}`,
    form.customerName && `Name: ${form.customerName}`,
    form.phone && `Phone: ${form.phone}`,
    `${form.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}${form.date ? ` on ${form.date}` : ''}`,
    form.deliveryType === 'delivery' && form.address && `Address: ${form.address}`,
  ]
    .filter(Boolean)
    .join('\n')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const saved = await createOrder({
        ...form,
        address: form.deliveryType === 'delivery' ? form.address : '',
        // Only which item and how many: the server looks up the real name and price
        items: [{ slug: item.slug, qty }],
        note,
      })
      setOrderNumber(saved.orderNumber || '')
      // Save the number in this browser, so the Track page can offer it next time
      if (saved.orderNumber) rememberOrder({ orderNumber: saved.orderNumber, item: item.name, date: form.date })
      setStatus('success')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const startOver = () => {
    setQty(1)
    setNote('')
    setForm(EMPTY_FORM)
    setOrderNumber('')
    setCopied(false)
    setStatus('idle')
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopied(true)
    } catch {
      // copying blocked by the browser – the number is still on screen to write down
    }
  }

  return (
    <div className="order">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          // ---------- Thank-you message ----------
          <motion.div
            key="success"
            className="order__success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            role="status"
          >
            <FiCheckCircle className="order__success-icon" aria-hidden="true" />
            <h2>Thank you, {form.customerName.split(' ')[0]}!</h2>
            <p>
              We received your order for {qty} × {item.name} ({formatPrice(total)}).
              We will confirm it with you on WhatsApp soon.
            </p>

            {orderNumber && (
              <div className="order__number">
                <span>Your order number</span>
                <div className="order__number-row">
                  <strong>{orderNumber}</strong>
                  <button type="button" onClick={copyNumber} aria-label="Copy order number">
                    {copied ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
                <small>Save this number (and use your phone number) to track your order.</small>
              </div>
            )}

            <div className="order__success-actions">
              {orderNumber && (
                <Link to={`/track?number=${orderNumber}`} className="btn btn-dark">
                  <FiMapPin /> Track order
                </Link>
              )}
              <a href={whatsappLink(whatsappMessage)} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
                <FaWhatsapp /> Send on WhatsApp
              </a>
            </div>
            <button type="button" className="order__again" onClick={startOver}>Place another order</button>
          </motion.div>
        ) : (
          // ---------- Order form ----------
          <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                maxLength={200}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={isCake ? 'e.g. Happy Birthday Riya!' : 'e.g. less sugar, gift wrap…'}
              />
            </label>

            <div className="order__grid">
              <label className="field">
                <span>Your name</span>
                <input name="customerName" value={form.customerName} onChange={updateField} required maxLength={60} autoComplete="name" />
              </label>
              <label className="field">
                <span>Phone number</span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={updateField}
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                  placeholder="10-digit number"
                  autoComplete="tel-national"
                />
              </label>
            </div>

            <fieldset className="field">
              <legend>Pickup or delivery?</legend>
              <div className="toggle">
                {['pickup', 'delivery'].map((type) => (
                  <label key={type} className={form.deliveryType === type ? 'is-active' : ''}>
                    <input type="radio" name="deliveryType" value={type} checked={form.deliveryType === type} onChange={updateField} />
                    {type === 'pickup' ? 'Pickup' : 'Delivery'}
                  </label>
                ))}
              </div>
            </fieldset>

            {form.deliveryType === 'delivery' && (
              <label className="field">
                <span>Delivery address</span>
                <textarea name="address" rows={2} value={form.address} onChange={updateField} required maxLength={300} autoComplete="street-address" />
              </label>
            )}

            <label className="field">
              <span>{form.deliveryType === 'delivery' ? 'Delivery date' : 'Pickup date'}</span>
              <input name="date" type="date" min={today()} value={form.date} onChange={updateField} required />
            </label>

            {status === 'error' && <p className="order__error" role="alert">{error}</p>}

            <div className="order__actions">
              <button type="submit" className="btn btn-dark" disabled={status === 'sending'}>
                {status === 'sending' ? 'Placing order…' : `Place order · ${formatPrice(total)}`}
              </button>
              <a href={whatsappLink(whatsappMessage)} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
                <FaWhatsapp /> Order on WhatsApp
              </a>
            </div>
            <p className="order__hint">We confirm every order personally. Payment on confirmation.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
