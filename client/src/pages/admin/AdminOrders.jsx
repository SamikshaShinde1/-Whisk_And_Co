import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { FiBookOpen, FiKey, FiLogOut, FiRefreshCw, FiPhone, FiSearch, FiX } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ChangePassword from './ChangePassword'
import { getOrders, updateOrderStatus } from '../../api'
import { formatPrice } from '../../data/menu'
import { FINAL_STATUSES, ORDER_STATUSES, statusChangeProblem } from '../../orderStatus'
import usePageTitle from '../../hooks/usePageTitle'
import useAdminSession from '../../hooks/useAdminSession'
import './Admin.css'

// What a finished order shows instead of the dropdown
const LOCKED_LABEL = { delivered: 'Completed', cancelled: 'Cancelled' }

// The "Are you sure?" text for the two final statuses
const CONFIRM = {
  delivered: {
    title: 'Mark as delivered?',
    text: "The order will be completed and locked. You can't change its status after this.",
    button: 'Yes, delivered',
  },
  cancelled: {
    title: 'Cancel this order?',
    text: "The order will be cancelled and locked. You can't change its status after this.",
    button: 'Yes, cancel order',
  },
}

// "2026-10-29T06:21:00Z" -> "29 Oct, 11:51 am"
const formatPlaced = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// "2026-11-02" -> "Mon, 2 Nov"
const formatDate = (day) =>
  new Date(`${day}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export default function AdminOrders() {
  usePageTitle('Orders')
  const { admin, logout, handleSessionError } = useAdminSession()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [savingId, setSavingId] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState(null) // { order, status } while "Are you sure?" is open

  // Logged-out errors go back to the login page; other errors are shown on this page
  const handleError = useCallback(
    (err) => {
      if (!handleSessionError(err)) setError(err.message)
    },
    [handleSessionError],
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

  // "delivered" and "cancelled" can't be undone, so ask first
  const chooseStatus = (order, status) => {
    if (FINAL_STATUSES.includes(status)) setConfirming({ order, status })
    else changeStatus(order, status)
  }

  const confirmChange = () => {
    changeStatus(confirming.order, confirming.status)
    setConfirming(null)
  }

  // Search by order number, customer name or phone (e.g. when a customer forgot their order number)
  const query = search.trim().toLowerCase()
  const queryDigits = query.replace(/\D/g, '')
  const matchesSearch = (o) =>
    (o.orderNumber || '').toLowerCase().includes(query) ||
    o.customerName.toLowerCase().includes(query) ||
    (queryDigits.length >= 3 && o.phone.includes(queryDigits))
  const found = query ? orders.filter(matchesSearch) : orders

  const count = (status) => found.filter((o) => o.status === status).length
  const shown = filter === 'all' ? found : found.filter((o) => o.status === filter)

  return (
    <>
      <PageHeader script="admin" title="Orders" text={`Logged in as ${admin.email}`}>
        <div className="admin__toolbar">
          <button className={`admin__tool admin__tool--refresh ${loading ? 'is-loading' : ''}`} onClick={refresh} disabled={loading}>
            <FiRefreshCw /> {loading ? 'Loading…' : 'Refresh'}
          </button>
          <Link to="/admin/menu" className="admin__tool admin__tool--menu">
            <FiBookOpen /> Manage menu
          </Link>
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

          <label className="admin__search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number, name or phone"
              aria-label="Search orders"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                <FiX />
              </button>
            )}
          </label>

          {/* Filter by status, with a count on each pill */}
          <div className="menu__filters admin__filters" role="group" aria-label="Filter by status">
            {['all', ...ORDER_STATUSES].map((status) => (
              <button
                key={status}
                className={`menu__pill ${filter === status ? 'is-active' : ''}`}
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
              >
                {status} ({status === 'all' ? found.length : count(status)})
              </button>
            ))}
          </div>

          {error && <p className="admin__error" role="alert">{error}</p>}

          {!loading && shown.length === 0 && !error && (
            <p className="admin__empty">
              {query
                ? `No ${filter === 'all' ? '' : `"${filter}" `}orders match "${search.trim()}".`
                : `No ${filter === 'all' ? '' : `"${filter}" `}orders yet. 🧁`}
            </p>
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
                        <small>{order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}</small>
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
                          <div key={i}>
                            {item.qty} × {item.name}
                            {item.note && <small className="admin__note">“{item.note}”</small>}
                          </div>
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
                        {FINAL_STATUSES.includes(order.status) ? (
                          <span className={`admin__status admin__status--${order.status} admin__status--locked`}>
                            <span aria-hidden="true">🔒</span> {LOCKED_LABEL[order.status]}
                          </span>
                        ) : (
                          <select
                            className={`admin__status admin__status--${order.status}`}
                            value={order.status}
                            onChange={(e) => chooseStatus(order, e.target.value)}
                            disabled={savingId === order._id}
                            aria-label={`Status of order from ${order.customerName}`}
                          >
                            {/* Past statuses (and "cancelled" once it's ready) are greyed out: an order only moves forward */}
                            {ORDER_STATUSES.map((status) => (
                              <option key={status} value={status} disabled={Boolean(statusChangeProblem(order.status, status))}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* "Are you sure?" before a final status */}
      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title={CONFIRM[confirming?.status]?.title || ''}>
        {confirming && (
          <>
            <p className="admin__confirm">
              <strong>{confirming.order.orderNumber || confirming.order.customerName}</strong>: {CONFIRM[confirming.status].text}
            </p>
            <div className="admin__confirm-actions">
              <button type="button" className="btn btn-outline" onClick={() => setConfirming(null)}>Not now</button>
              <button
                type="button"
                className={`btn ${confirming.status === 'cancelled' ? 'btn-danger' : 'btn-dark'}`}
                onClick={confirmChange}
              >
                {CONFIRM[confirming.status].button}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
