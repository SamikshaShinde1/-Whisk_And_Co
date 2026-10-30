import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import Order, { ORDER_STATUSES } from '../models/Order.js'
import Product, { priceNow } from '../models/Product.js'
import { nextOrderNumber } from '../models/Counter.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = Router()

// Stops spam: at most 10 orders per visitor every 15 minutes
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many orders from your device. Please try again later or message us on WhatsApp.' },
})

// Stops someone from guessing order numbers: at most 30 lookups every 15 minutes
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many tries. Please wait a few minutes and try again.' },
})

// POST /api/orders – a customer places an order (public)
router.post('/', orderLimiter, async (req, res) => {
  const { customerName, phone, items, note, deliveryType, address, date } = req.body

  // The browser sends only which item and how many: [{ slug: 'red-velvet-cake', qty: 2 }].
  // The name and price always come from our database, so nobody can change a price.
  const wanted = Array.isArray(items) ? items : []
  const slugs = wanted.map((item) => String(item?.slug || ''))
  // mongoose.trusted: this $in is ours (sanitizeFilter would otherwise block it); every slug is a plain string
  const products = await Product.find({ slug: mongoose.trusted({ $in: slugs }) })

  const cleanItems = []
  for (const item of wanted) {
    const product = products.find((p) => p.slug === String(item?.slug || ''))
    if (!product || product.archived) {
      return res.status(400).json({ message: 'One of the items is no longer on the menu. Please refresh the page.' })
    }
    if (!product.available) {
      return res.status(400).json({ message: `Sorry, ${product.name} is sold out right now.` })
    }
    // priceNow: the offer price while a special is running today, otherwise the normal price
    cleanItems.push({ name: product.name, price: priceNow(product), qty: item.qty })
  }

  // Work out the total on the server instead of trusting the number sent by the browser
  const total = cleanItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0)

  const order = new Order({
    customerName,
    phone,
    items: cleanItems,
    note,
    deliveryType,
    address: deliveryType === 'delivery' ? address : '',
    date,
    total,
  })

  // Check the details first, so a rejected order doesn't use up an order number
  await order.validate()
  order.orderNumber = await nextOrderNumber()
  await order.save()

  // Send back only what the customer needs to see
  res.status(201).json({ _id: order._id, orderNumber: order.orderNumber, total: order.total, status: order.status })
})

// POST /api/orders/track – a customer checks their order (public), body: { number, phone }
// It's a POST (not a GET) so the phone number travels hidden in the body,
// instead of in the web address where it would end up in browser history and server logs.
// The order is only shown when BOTH the order number and the phone number match.
router.post('/track', trackLimiter, async (req, res) => {
  const number = String(req.body?.number || '').trim().toUpperCase()
  const phone = String(req.body?.phone || '').replace(/\D/g, '')

  if (!/^PNP-\d{4,}$/.test(number) || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      message: 'Please enter your order number (like PNP-1042) and your 10-digit phone number.',
    })
  }

  // .select() picks ONLY the safe fields – no name, phone, address or note is ever sent back
  const order = await Order.findOne({ orderNumber: number, phone }).select(
    'orderNumber items total date deliveryType status createdAt -_id',
  )

  // Same message whether the number or the phone was wrong, so nobody can guess which one exists
  if (!order) {
    return res.status(404).json({
      message: "We couldn't find an order with that number and phone. Please check both and try again.",
    })
  }
  res.json(order)
})

// GET /api/orders – all orders, newest first (admin only)
router.get('/', requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 })
  res.json(orders)
})

// PATCH /api/orders/:id – change an order's status (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` })
  }

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' })
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }
  res.json(order)
})

export default router
