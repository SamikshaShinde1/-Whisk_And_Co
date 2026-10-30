import { formatPrice } from './data/menu'
import { SITE } from './config/site'

// Writes an order as a ready-to-send WhatsApp message.
// items: [{ name, unit, qty, lineTotal, note }]
// details: the checkout form { customerName, phone, deliveryType, address, date }
export function orderMessage({ orderNumber, items, total, details = {}, note }) {
  return [
    orderNumber ? `Hi ${SITE.name}! I just placed order ${orderNumber}:` : `Hi ${SITE.name}! I'd like to order:`,
    ...items.flatMap((item) => [
      `• ${item.name}${item.unit ? ` (${item.unit})` : ''} × ${item.qty} = ${formatPrice(item.lineTotal)}`,
      item.note && `   Note: ${item.note}`,
    ]),
    `Total: ${formatPrice(total)}`,
    note && `Note: ${note}`,
    details.customerName && `Name: ${details.customerName}`,
    details.phone && `Phone: ${details.phone}`,
    details.deliveryType && `${details.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}${details.date ? ` on ${details.date}` : ''}`,
    details.deliveryType === 'delivery' && details.address && `Address: ${details.address}`,
  ]
    .filter(Boolean)
    .join('\n')
}
