import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { FiKey, FiLogOut, FiRefreshCw, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import PageHeader from '../../components/PageHeader'
import ChangePassword from './ChangePassword'
import { getOrders, updateOrderStatus } from '../../api'
import { clearAdmin, getAdmin } from '../../adminAuth'
import { formatPrice } from '../../data/menu'
import usePageTitle from '../../hooks/usePageTitle'
import './Admin.css'

// Must match ORDER_STATUSES in server/models/Order.js
const STATUSES = ['new', 'baking', 'ready', 'delivered']

// "2026-10-29T06:21:00Z" -> "29 Oct, 11:51 am"
const formatPlaced = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// "2026-11-02" -> "Mon, 2 Nov"
const formatDate = (day) =>
  new Date(`${day}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export default function AdminOrders() {
  usePageTitle('Orders')
  const navigate = useNavigate()
  const [admin] = useState(getAdmin)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [savingId, setSavingId] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const logout = useCallback(
    (message) => {
      clearAdmin()
      navigate('/admin/login', { replace: true, state: message ? { message } : undefined })
    },
    [navigate],
  )

  // An expired or invalid token sends you back to the login page
  const handleError = useCallback(
    (err) => {
      if (err.status === 401) logout('Your session has expired. Please log in again.')
      else setError(err.message)
    },
    [logout],
  )

  const fetchOrders = useCallback(
    () =>
      getOrders(admin?.token)
        .then(setOrders)
        .catch(handleError)
        .finally(() => setLoading(false)),
    [admin, handleError],
  )

  // Load the orders when the page opens
  useEffect(() => {
    if (admin) fetchOrders()
  }, [admin, fetchOrders])

  const refresh = () => {
    setLoading(true)
    setError('')
    fetchOrders()
  }

  // Not logged in? Go to the login page.
  if (!admin) return <Navigate to="/admin/login" replace />

  // Change the status on screen straight away, and undo it if the server says no
  const changeStatus = async (order, status) => {
    const setStatus = (value) =>
      setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, status: value } : o)))

    setSavingId(order._id)
    setStatus(status)
    try {
      await updateOrderStatus(order._id, status, admin.token)
    } catch (err) {
      setStatus(order.status)
      handleError(err)
    } finally {
      setSavingId(null)
    }
  }

  const count = (status) => orders.filter((o) => o.status === status).length
  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <>
      <PageHeader script="admin" title="Orders" text={`Logged in as ${admin.email}`}>
        <div className="admin__toolbar">
          <button className={`admin__tool admin__tool--refresh ${loading ? 'is-loading' : ''}`} onClick={refresh} disabled={loading}>
            <FiRefreshCw /> {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            className={`admin__tool admin__tool--key ${showPassword ? 'is-active' : ''}`}
            onClick={() => setShowPassword(!showPassword)}
            aria-expanded={showPassword}
          >
            <FiKey /> Change password
          </button>
          <button className="admin__tool admin__tool--logout" onClick={() => logout()}>
            <FiLogOut /> Log out
          </button>
        </div>
      </PageHeader>

      <section className="section admin">
        <div className="container">
          <AnimatePresence>
            {showPassword && (
              <ChangePassword token={admin.token} onAuthError={handleError} onClose={() => setShowPassword(false)} />
            )}
          </AnimatePresence>

          {/* Filter by status, with a count on each pill */}
          <div className="menu__filters admin__filters" role="group" aria-label="Filter by status">
            {['all', ...STATUSES].map((status) => (
              <button
                key={status}
                className={`menu__pill ${filter === status ? 'is-active' : ''}`}
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
              >
                {status} ({status === 'all' ? orders.length : count(status)})
              </button>
            ))}
          </div>

          {error && <p className="admin__error" role="alert">{error}</p>}

          {!loading && shown.length === 0 && !error && (
            <p className="admin__empty">No {filter === 'all' ? '' : `"${filter}" `}orders yet. 🧁</p>
          )}

          {shown.length > 0 && (
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Placed</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Pickup / delivery</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((order) => (
                    <tr key={order._id}>
                      <td data-label="Placed">
                        {formatPlaced(order.createdAt)}
                        <small>#{order._id.slice(-6).toUpperCase()}</small>
                      </td>
                      <td data-label="Customer">
                        <strong>{order.customerName}</strong>
                        <span className="admin__contact">
                          <a href={`tel:${order.phone}`}><FiPhone /> {order.phone}</a>
                          <a href={`https://wa.me/91${order.phone}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${order.customerName}`}>
                            <FaWhatsapp />
                          </a>
                        </span>
                      </td>
                      <td data-label="Items">
                        {order.items.map((item, i) => (
                          <div key={i}>{item.qty} × {item.name}</div>
                        ))}
                        {order.note && <small className="admin__note">“{order.note}”</small>}
                      </td>
                      <td data-label="Pickup / delivery">
                        <strong>{order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</strong>
                        <span>{formatDate(order.date)}</span>
                        {order.address && <small>{order.address}</small>}
                      </td>
                      <td data-label="Total">
                        <strong>{formatPrice(order.total)}</strong>
                      </td>
                      <td data-label="Status">
                        <select
                          className={`admin__status admin__status--${order.status}`}
                          value={order.status}
                          onChange={(e) => changeStatus(order, e.target.value)}
                          disabled={savingId === order._id}
                          aria-label={`Status of order from ${order.customerName}`}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
