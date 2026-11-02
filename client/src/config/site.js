// All the bakery's details live here, so you can edit text in one place.

// The WhatsApp number is read from client/.env (VITE_WHATSAPP_NUMBER), never typed in code.
// Only digits are kept: country code + number, e.g. 91XXXXXXXXXX.
const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')

export const SITE = {
  name: 'Whisk & Co.',
  tagline: 'Home bakery · Baked fresh with love',
  instagramHandle: '@wiskco01',
  instagramUrl: 'https://www.instagram.com/wiskco01/',
  whatsappNumber,
  hours: [
    { days: 'Mon – Sat', time: '9 AM – 8 PM' },
    { days: 'Sunday', time: 'Pre-orders only' }, // the rules are in src/indiaTime.js (orderDateProblem)
  ],
  preorderNote:
    'Order at least a day ahead so we can bake it fresh for you. Custom cakes need 2–3 days. On Sundays we take pre-orders only: order by Saturday 8 PM for Sunday, or any time for Monday onwards.',
}

// Builds a WhatsApp chat link with a ready-made message.
export function whatsappLink(message = `Hi ${SITE.name}! I'd like to place an order.`) {
  const text = encodeURIComponent(message)
  return whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${text}`
    : `https://wa.me/?text=${text}`
}
