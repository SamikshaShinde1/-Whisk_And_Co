import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiCheckCircle, FiCopy, FiEdit2, FiMapPin, FiShoppingBag } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import { LoadingNote } from '../components/MenuStatus'
import { createOrder } from '../api'
import { rememberOrder } from '../recentOrders'
import { orderMessage } from '../orderMessage'
import { formatPrice } from '../data/menu'
import { whatsappLink } from '../config/site'
import { earliestOrderDate, orderDateProblem } from '../indiaTime'
import { SundayNote } from '../components/SundayNotice'
import usePageTitle from '../hooks/usePageTitle'
import useCart, { useCartDetails } from '../hooks/useCart'
import '../components/OrderPanel.css' // shared form, toggle and thank-you styles
import './Checkout.css'

const EMPTY_FORM = { customerName: '', phone: '', deliveryType: 'pickup', address: '', date: '', note: '' }

// The cart lines as the WhatsApp message needs them
const toMessageItems = (items) =>
  items.map((item) => ({ name: item.product.name, unit: item.product.unit, qty: item.qty, lineTotal: item.lineTotal, note: item.note }))

// Checkout: the customer's details, then ONE order with everything in the cart.
export default function Checkout() {
  usePageTitle('Checkout')
  const { lines, clearCart, openCart } = useCart()
  const { items, total, hasProblems, loading } = useCartDetails()

  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('idle') // idle | sending | error
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState(null) // the finished order, kept after the cart is emptied
  const [copied, setCopied] = useState(false)

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  // Same date rules as the server (Indian time): explained under the date box straight away
  const dateProblem = form.date ? orderDateProblem(form.date) : ''
  const details = { ...form, address: form.deliveryType === 'delivery' ? form.address : '' }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (dateProblem) return
    setStatus('sending')
    setError('')
    try {
      // Only which item, how many and its note: the server looks up names and prices again
      const saved = await createOrder({ ...details, items: lines.map(({ slug, qty, note }) => ({ slug, qty, note })) })

      const summary = toMessageItems(items)
      setPlaced({ orderNumber: saved.orderNumber || '', total: saved.total, items: summary, details, note: form.note })
      if (saved.orderNumber) {
        const first = summary[0].name
        rememberOrder({ orderNumber: saved.orderNumber, item: summary.length > 1 ? `${first} + ${summary.length - 1} more` : first, date: form.date })
      }
      clearCart()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(placed.orderNumber)
      setCopied(true)
    } catch {
      // copying blocked by the browser: the number is still on screen
    }
  }

  // ---------- Thank you ----------
  if (placed) {
    return (
      <>
        <PageHeader script="thank you" title="Order placed" />
        <section className="section checkout">
          <div className="container checkout__narrow">
            <div className="order order__success" role="status">
              <FiCheckCircle className="order__success-icon" aria-hidden="true" />
              <h2>Thank you, {placed.details.customerName.split(' ')[0]}!</h2>
              <p>
                We received your order of {placed.items.length} {placed.items.length === 1 ? 'item' : 'items'} ({formatPrice(placed.total)}).
                We will confirm it with you on WhatsApp soon.
              </p>

              {placed.orderNumber && (
                <div className="order__number">
                  <span>Your order number</span>
                  <div className="order__number-row">
                    <strong>{placed.orderNumber}</strong>
                    <button type="button" onClick={copyNumber} aria-label="Copy order number">
                      {copied ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                  <small>Save this number (and use your phone number) to track your order.</small>
                </div>
              )}

              <div className="order__success-actions">
                {placed.orderNumber && (
                  <Link to={`/track?number=${placed.orderNumber}`} className="btn btn-dark">
                    <FiMapPin /> Track order
                  </Link>
                )}
                <a href={whatsappLink(orderMessage(placed))} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
                  <FaWhatsapp /> Send on WhatsApp
                </a>
              </div>
              <Link to="/menu" className="order__again">Back to the menu</Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  // ---------- Empty cart ----------
  if (lines.length === 0) {
    return (
      <>
        <PageHeader script="almost there" title="Checkout" />
        <section className="section checkout">
          <div className="container checkout__narrow">
            <div className="order checkout__empty">
              <FiShoppingBag className="checkout__empty-icon" aria-hidden="true" />
              <h2>Your cart is empty</h2>
              <p>Pick a few treats from the menu, then come back here to order.</p>
              <Link to="/menu" className="btn btn-dark">Browse menu</Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  // ---------- Details form + order summary ----------
  return (
    <>
      <PageHeader script="almost there" title="Checkout" text="Tell us who you are and when you'd like your treats." />
      <section className="section checkout">
        <div className="container checkout__grid">
          <form className="order checkout__form" onSubmit={handleSubmit}>
            <h2 className="checkout__heading">Your details</h2>
            <SundayNote />
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
              <input
                name="date"
                type="date"
                min={earliestOrderDate()}
                value={form.date}
                onChange={updateField}
                required
                aria-invalid={Boolean(dateProblem)}
                aria-describedby="date-help"
              />
              {dateProblem ? (
                <small id="date-help" className="field__problem" role="alert">{dateProblem}</small>
              ) : (
                <small id="date-help" className="field__help">Sunday orders must be placed by Saturday 8 PM.</small>
              )}
            </label>

            <label className="field">
              <span>Anything else we should know? <em>(optional)</em></span>
              <textarea name="note" rows={2} value={form.note} onChange={updateField} maxLength={200} placeholder="e.g. call when you arrive" />
            </label>

            {status === 'error' && <p className="order__error" role="alert">{error}</p>}
            {hasProblems && (
              <p className="order__error" role="alert">
                Some items in your cart are sold out. <button type="button" className="checkout__link" onClick={openCart}>Open the cart</button> to remove them.
              </p>
            )}

            <div className="order__actions">
              <button type="submit" className="btn btn-dark" disabled={status === 'sending' || hasProblems || loading || Boolean(dateProblem)}>
                {status === 'sending' ? 'Placing order…' : `Place order · ${formatPrice(total)}`}
              </button>
              <a
                href={whatsappLink(orderMessage({ items: toMessageItems(items.filter((i) => !i.problem && i.product)), total, details, note: form.note }))}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
              >
                <FaWhatsapp /> Order on WhatsApp
              </a>
            </div>
            <p className="order__hint">We confirm every order personally. Payment on confirmation.</p>
          </form>

          {/* ---------- Summary ---------- */}
          <aside className="order checkout__summary" aria-label="Order summary">
            <div className="checkout__summary-head">
              <h2 className="checkout__heading">Your order</h2>
              <button type="button" className="checkout__link" onClick={openCart}>
                <FiEdit2 /> Edit
              </button>
            </div>
            {loading && <LoadingNote />}
            <ul className="checkout__items">
              {items.map((item) => (
                <li key={item.id} className={item.problem ? 'has-problem' : ''}>
                  <span className="checkout__qty">{item.qty}×</span>
                  <span className="checkout__name">
                    {item.product?.name || 'Removed item'}
                    {item.note && <small>“{item.note}”</small>}
                    {item.problem && <small className="checkout__problem">{item.problem}</small>}
                  </span>
                  <strong>{item.problem ? '–' : formatPrice(item.lineTotal)}</strong>
                </li>
              ))}
            </ul>
            <div className="checkout__total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
