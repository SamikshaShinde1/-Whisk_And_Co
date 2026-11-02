import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { FiSearch, FiClock } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import OrderProgress from '../components/OrderProgress'
import PrivacyNote from '../components/PrivacyNote'
import { trackOrder } from '../api'
import { forgetRecentOrders, getRecentOrders, noteOrderStatus } from '../recentOrders'
import { formatPrice } from '../data/menu'
import { SITE, whatsappLink } from '../config/site'
import usePageTitle from '../hooks/usePageTitle'
import './Track.css'

// "2026-11-02" -> "Monday, 2 November"
const formatDate = (day) =>
  new Date(`${day}T00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

export default function Track() {
  usePageTitle('Track your order')

  // The success message links here as /track?number=WC-1042, so the number is filled in for you
  const [searchParams] = useSearchParams()
  const [number, setNumber] = useState(searchParams.get('number') || '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  // Orders placed from this browser in the last 7 days (saved by Checkout), not yet finished
  const [recent, setRecent] = useState(getRecentOrders)
  const phoneInput = useRef(null)

  // Tap a recent order: fill in its number and move to the phone box
  const pickRecent = (orderNumber) => {
    setNumber(orderNumber)
    phoneInput.current?.focus()
  }

  const forgetRecent = () => {
    forgetRecentOrders()
    setRecent([])
  }

  // "Forgot your number?" opens WhatsApp with a message for the bakery (includes the phone if typed)
  const digits = phone.replace(/\D/g, '')
  const forgotMessage = `Hi ${SITE.name}! I placed an order but forgot my order number. My phone number is ${
    digits.length === 10 ? digits : '…'
  }.`

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const found = await trackOrder(number.trim(), phone.trim())
      setOrder(found)
      // Finished (delivered or cancelled)? Take it off the "recent orders" list on this device.
      noteOrderStatus(found.orderNumber, found.status)
      setRecent(getRecentOrders())
    } catch (err) {
      setOrder(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        script="where's my treat?"
        title="Track your order"
        text="Enter your order number and the phone number you ordered with."
      />

      <section className="section track">
        <div className="container track__inner">
          {/* Nothing at all for a new visitor */}
          {recent.length > 0 && (
            <section className="track__recent" aria-labelledby="recent-heading">
              <h2 id="recent-heading" className="track__small">
                <FiClock aria-hidden="true" /> Your recent orders on this device
              </h2>
              <div className="track__recent-list">
                {recent.map((o) => (
                  <button
                    key={o.orderNumber}
                    type="button"
                    className={`track__chip ${number === o.orderNumber ? 'is-active' : ''}`}
                    onClick={() => pickRecent(o.orderNumber)}
                  >
                    <strong>{o.orderNumber}</strong>
                    <span>{o.item}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="track__link" onClick={forgetRecent}>
                Not your device? Forget these
              </button>
            </section>
          )}

          <form className="track__form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Order number</span>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase())}
                placeholder="WC-1042"
                required
                maxLength={12}
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
            <label className="field">
              <span>Phone number</span>
              <input
                ref={phoneInput}
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                required
                pattern="[0-9 ]{10,12}"
                title="Please enter your 10-digit phone number"
                autoComplete="tel-national"
              />
            </label>
            <button type="submit" className="btn btn-dark" disabled={loading}>
              <FiSearch /> {loading ? 'Searching…' : 'Track'}
            </button>
          </form>
          <PrivacyNote />

          <p className="track__forgot">
            Forgot your order number?{' '}
            <a href={whatsappLink(forgotMessage)} target="_blank" rel="noreferrer">
              <FaWhatsapp /> Ask us on WhatsApp
            </a>
          </p>

          {error && <p className="admin__error" role="alert">{error}</p>}

          <AnimatePresence mode="wait">
            {order && (
              <motion.article
                key={`${order.orderNumber}-${order.status}`}
                className="track__result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <header className="track__head">
                  <div>
                    <span className="track__small">Order</span>
                    <h2>{order.orderNumber}</h2>
                  </div>
                  <div className="track__when">
                    <span className="track__small">{order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                    <strong>{formatDate(order.date)}</strong>
                  </div>
                </header>

                <OrderProgress status={order.status} deliveryType={order.deliveryType} />

                <ul className="track__items">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      <span>{item.qty} × {item.name}</span>
                      <span>{formatPrice(item.price * item.qty)}</span>
                    </li>
                  ))}
                  <li className="track__total">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </li>
                </ul>

                <a
                  href={whatsappLink(`Hi ${SITE.name}! I have a question about my order ${order.orderNumber}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp track__help"
                >
                  <FaWhatsapp /> Questions? Message us
                </a>
              </motion.article>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}
