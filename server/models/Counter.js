import mongoose from 'mongoose'

// A tiny "ticket machine" that hands out the next number, like at a bakery counter.
// The database adds 1 in a single step, so two orders placed at the same moment
// can never get the same number.
const counterSchema = new mongoose.Schema({
  _id: String, // which counter, e.g. 'order'
  seq: { type: Number, default: 0 },
})

const Counter = mongoose.model('Counter', counterSchema)

// Order numbers start at PNP-1001
const FIRST_ORDER_NUMBER = 1001

export async function nextOrderNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'order' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  )
  return `PNP-${FIRST_ORDER_NUMBER - 1 + counter.seq}`
}
