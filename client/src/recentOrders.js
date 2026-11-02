// Remembers the customer's last few order numbers in this browser, so they don't have to.
// Only the order number, item name and date are saved – never the phone, name or address,
// because other people might use the same phone or computer.
// Orders are forgotten automatically after 7 days, or as soon as tracking shows they are finished.

import { FINAL_STATUSES } from './orderStatus'

const KEY = 'pnp-recent-orders'
const MAX_ORDERS = 5
const KEEP_FOR = 7 * 24 * 60 * 60 * 1000 // 7 days, in milliseconds

function save(list) {
  try {
    if (list.length > 0) localStorage.setItem(KEY, JSON.stringify(list))
    else localStorage.removeItem(KEY)
  } catch {
    // storage blocked (e.g. private mode) – the customer still sees the number on screen
  }
}

// [{ orderNumber: 'WC-1042', item: 'Red Velvet Cake', date: '2026-11-02', savedAt: 1793000000000 }, ...] newest first
// Orders older than 7 days (or saved before "savedAt" existed) are removed here.
export function getRecentOrders() {
  let list
  try {
    list = JSON.parse(localStorage.getItem(KEY))
  } catch {
    return []
  }
  if (!Array.isArray(list)) return []

  const fresh = list.filter((o) => o?.orderNumber && Date.now() - o.savedAt < KEEP_FOR)
  if (fresh.length !== list.length) save(fresh)
  return fresh
}

export function rememberOrder(order) {
  const others = getRecentOrders().filter((o) => o.orderNumber !== order.orderNumber)
  save([{ ...order, savedAt: Date.now() }, ...others].slice(0, MAX_ORDERS))
}

// After tracking: a delivered or cancelled order doesn't need to be remembered any more
export function noteOrderStatus(orderNumber, status) {
  if (!FINAL_STATUSES.includes(status)) return
  save(getRecentOrders().filter((o) => o.orderNumber !== orderNumber))
}

export function forgetRecentOrders() {
  save([])
}
