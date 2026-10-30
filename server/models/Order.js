import mongoose from 'mongoose'

export const ORDER_STATUSES = ['new', 'baking', 'ready', 'delivered']

// The most different lines one order (one cart) can have
export const MAX_ORDER_LINES = 20

// One line of an order, e.g. { name: 'Red Velvet Cake', price: 700, qty: 2, note: 'Happy Birthday Riya!' }
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    price: { type: Number, required: true, min: 0 },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [50, 'Quantity can be at most 50'],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
    // A note for this item only, e.g. the message on a cake
    note: { type: String, trim: true, maxlength: [200, 'A note is too long (200 characters max).'], default: '' },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    // Short number customers use to track their order, e.g. "PNP-1042".
    // "sparse" lets older orders (placed before order numbers existed) have none.
    orderNumber: { type: String, unique: true, sparse: true },
    customerName: { type: String, required: [true, 'Please enter your name'], trim: true, maxlength: 60 },
    phone: {
      type: String,
      required: [true, 'Please enter your phone number'],
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },
    items: {
      type: [itemSchema],
      validate: [
        { validator: (items) => items.length > 0, message: 'Your order is empty' },
        { validator: (items) => items.length <= MAX_ORDER_LINES, message: `One order can have at most ${MAX_ORDER_LINES} different items` },
      ],
    },
    note: { type: String, trim: true, maxlength: 200, default: '' }, // a note for the whole order
    deliveryType: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
      // an address is only needed for delivery
      validate: {
        validator(value) {
          return this.deliveryType !== 'delivery' || value.length > 0
        },
        message: 'Please enter a delivery address',
      },
    },
    // pickup / delivery date as "YYYY-MM-DD"
    date: {
      type: String,
      required: [true, 'Please choose a date'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Please choose a valid date'],
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'new' },
  },
  { timestamps: true }, // adds createdAt and updatedAt automatically
)

export default mongoose.model('Order', orderSchema)
