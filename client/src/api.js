// Every call to our backend (server/) goes through this file.

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

// ---------- "Waking up the oven…" ----------
// The free server on Render sleeps after 15 minutes with no visitors, and the first request
// can then take up to a minute. Any request slower than SLOW_AFTER counts as "slow",
// and components/WakeUpNotice.jsx shows a friendly message while one is running.
const SLOW_AFTER = 4000 // milliseconds
let slowRequests = 0
const listeners = new Set()

function setSlowRequests(change) {
  slowRequests += change
  listeners.forEach((listener) => listener())
}

// For useSyncExternalStore: is the server slow right now? And tell me when that changes.
export const isServerSlow = () => slowRequests > 0
export function subscribeToServerSlow(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Small helper around fetch: sends JSON, reads JSON, and throws a friendly error if something fails.
// A file upload (FormData) is sent as it is; the browser sets its own Content-Type for it.
async function request(path, options = {}) {
  let isSlow = false
  const timer = setTimeout(() => {
    isSlow = true
    setSlowRequests(+1)
  }, SLOW_AFTER)
  try {
    return await send(path, options)
  } finally {
    clearTimeout(timer)
    if (isSlow) setSlowRequests(-1)
  }
}

async function send(path, { method = 'GET', body, token } = {}) {
  const isFile = body instanceof FormData
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(!isFile && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: isFile ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Could not reach the bakery server. Please check your internet and try again.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

// Customers: place an order
export function createOrder(order) {
  return request('/api/orders', { method: 'POST', body: order })
}

// Customers: check an order's progress (needs BOTH the order number and the phone number).
// Sent as a POST so the phone number stays out of the web address.
export function trackOrder(number, phone) {
  return request('/api/orders/track', { method: 'POST', body: { number, phone } })
}

// The menu customers see, including sold-out items (they have available: false). No archived items.
export function getProducts() {
  return request('/api/products')
}

// Admin: every item, including archived ones
export function getAllProducts(token) {
  return request('/api/products/all', { token })
}

// Admin: add, change, archive (update with { archived: true }) and delete menu items
export function createProduct(product, token) {
  return request('/api/products', { method: 'POST', body: product, token })
}

export function updateProduct(id, changes, token) {
  return request(`/api/products/${id}`, { method: 'PUT', body: changes, token })
}

export function deleteProduct(id, token) {
  return request(`/api/products/${id}`, { method: 'DELETE', token })
}

// Admin: upload a photo, get back { url }
export function uploadProductImage(file, token) {
  const form = new FormData()
  form.append('image', file)
  return request('/api/products/upload', { method: 'POST', body: form, token })
}

// Admin: log in and get a token
export function login(email, password) {
  return request('/api/auth/login', { method: 'POST', body: { email, password } })
}

// Admin: change your own password
export function changePassword(currentPassword, newPassword, token) {
  return request('/api/auth/password', { method: 'PATCH', body: { currentPassword, newPassword }, token })
}

// Admin: all orders, newest first
export function getOrders(token) {
  return request('/api/orders', { token })
}

// Admin: change one order's status
export function updateOrderStatus(id, status, token) {
  return request(`/api/orders/${id}`, { method: 'PATCH', body: { status }, token })
}
