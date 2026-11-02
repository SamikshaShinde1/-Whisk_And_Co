// The one-way rules for an order's status.
// The server has the same rules in server/utils/orderStatus.js (and enforces them) – keep the two the same.

// The normal journey of an order, in order. It only ever moves forward (skipping a step is fine).
export const STATUS_FLOW = ['new', 'baking', 'ready', 'delivered']

// Every status an order can have
export const ORDER_STATUSES = [...STATUS_FLOW, 'cancelled']

// Once an order is here, it can't change any more
export const FINAL_STATUSES = ['delivered', 'cancelled']

// An order can only be cancelled before it is ready
export const CANCELLABLE = ['new', 'baking']

// Can an order go from "from" to "to"? Returns "" if yes, or a friendly reason if not.
export function statusChangeProblem(from, to) {
  if (!ORDER_STATUSES.includes(to)) return `Status must be one of: ${ORDER_STATUSES.join(', ')}.`
  if (from === to) return '' // nothing changes

  if (from === 'delivered') return 'This order is already delivered, so its status can no longer be changed.'
  if (from === 'cancelled') return 'This order was cancelled, so its status can no longer be changed.'

  if (to === 'cancelled') {
    return CANCELLABLE.includes(from) ? '' : `Only new or baking orders can be cancelled. This order is already "${from}".`
  }
  if (STATUS_FLOW.indexOf(to) < STATUS_FLOW.indexOf(from)) {
    return `An order can only move forward (new → baking → ready → delivered). This order is already "${from}".`
  }
  return ''
}
