// Remembers the customer's last few order numbers in this browser, so they don't have to.
// Only the order number, item name and date are saved – never the phone, name or address,
// because other people might use the same phone or computer.

const KEY = 'pnp-recent-orders'
const MAX_ORDERS = 5

// [{ orderNumber: 'PNP-1042', item: 'Red Velvet Cake', date: '2026-11-02' }, ...] newest first
export function getRecentOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function rememberOrder(order) {
  try {
    const others = getRecentOrders().filter((o) => o.orderNumber !== order.orderNumber)
    localStorage.setItem(KEY, JSON.stringify([order, ...others].slice(0, MAX_ORDERS)))
  } catch {
    // storage blocked (e.g. private mode) – the customer still sees the number on screen
  }
}

export function forgetRecentOrders() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
