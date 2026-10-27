import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import Order, { ORDER_STATUSES } from '../models/Order.js'
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

// POST /api/orders – a customer places an order (public)
router.post('/', orderLimiter, async (req, res) => {
  const { customerName, phone, items, note, deliveryType, address, date } = req.body

  // Keep only the fields we expect from each item
  const cleanItems = Array.isArray(items)
    ? items.map(({ name, price, qty }) => ({ name, price, qty }))
    : []

  // Work out the total on the server instead of trusting the number sent by the browser
  const total = cleanItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0)

  const order = await Order.create({
    customerName,
    phone,
    items: cleanItems,
    note,
    deliveryType,
    address: deliveryType === 'delivery' ? address : '',
    date,
    total,
  })

  // Send back only what the customer needs to see
  res.status(201).json({ _id: order._id, total: order.total, status: order.status })
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
