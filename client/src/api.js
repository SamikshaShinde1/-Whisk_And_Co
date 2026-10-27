// Every call to our backend (server/) goes through this file.

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

// Small helper around fetch: sends JSON, reads JSON, and throws a friendly error if something fails.
async function request(path, { method = 'GET', body, token } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
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
