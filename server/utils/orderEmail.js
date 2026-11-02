// Emails the bakery owner when a new order arrives, using Resend (resend.com, free plan).
// Resend is reached over normal HTTPS, which works on Render's free plan
// (Render's free plan blocks the email ports that Gmail/SMTP need).
//
// Needs in server/.env: RESEND_API_KEY and ORDER_EMAIL_TO (ORDER_EMAIL_FROM is optional).
// Without them the email is simply skipped – orders still work.

const RESEND_URL = 'https://api.resend.com/emails'
// Resend's test sender: works without your own domain, but only sends to the email you signed up with
const DEFAULT_FROM = 'Pastel n Postery <onboarding@resend.dev>'

// Customers type their name, notes and address, so make them safe to put inside HTML
const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const rupees = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`

// "2026-11-02" -> "Mon, 2 Nov, 2026"
const formatDay = (day) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

// The email's subject, plain text and HTML for one order
export function buildOrderEmail(order) {
  const how = order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'
  const when = `${how} on ${formatDay(order.date)}`
  const subject = `🧁 New order ${order.orderNumber}: ${order.customerName}, ${rupees(order.total)}`

  const itemLine = (item) => `${item.qty} × ${item.name} – ${rupees(item.price * item.qty)}${item.note ? ` ("${item.note}")` : ''}`

  const text = [
    `New order ${order.orderNumber}`,
    '',
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    when,
    order.address ? `Address: ${order.address}` : '',
    '',
    ...order.items.map(itemLine),
    '',
    `Total: ${rupees(order.total)}`,
    order.note ? `Order note: ${order.note}` : '',
  ]
    .filter((line, i, lines) => line !== '' || lines[i - 1] !== '') // no double blank lines
    .join('\n')

  const row = (label, value) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#7a6255">${label}</td><td style="padding:4px 0"><strong>${value}</strong></td></tr>`

  const html = `
<div style="font-family:Arial,sans-serif;color:#2b1a14;max-width:520px">
  <h2 style="margin:0 0 4px">New order ${escapeHtml(order.orderNumber)} 🧁</h2>
  <p style="margin:0 0 16px;color:#7a6255">${escapeHtml(when)}</p>
  <table style="border-collapse:collapse;margin-bottom:16px">
    ${row('Customer', escapeHtml(order.customerName))}
    ${row('Phone', `<a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>`)}
    ${order.address ? row('Address', escapeHtml(order.address)) : ''}
  </table>
  <ul style="padding-left:18px;margin:0 0 16px">
    ${order.items.map((item) => `<li>${escapeHtml(itemLine(item))}</li>`).join('\n    ')}
  </ul>
  <p style="font-size:18px;margin:0 0 8px"><strong>Total: ${rupees(order.total)}</strong></p>
  ${order.note ? `<p style="margin:0">Order note: ${escapeHtml(order.note)}</p>` : ''}
</div>`

  return { subject, text, html }
}

// Sends the email. Throws if Resend says no; the orders route catches that and only logs it.
export async function sendOrderEmail(order) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_EMAIL_TO
  if (!apiKey || !to) return // not set up (yet): skip quietly

  const { subject, text, html } = buildOrderEmail(order)
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ORDER_EMAIL_FROM || DEFAULT_FROM,
      to: to.split(',').map((email) => email.trim()),
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(10000), // give up after 10 seconds
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(`Resend answered ${response.status}: ${data.message || 'unknown error'}`)
  }
}
