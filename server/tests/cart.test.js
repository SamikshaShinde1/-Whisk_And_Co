// Tests for orders that come from the shopping cart: several items in one order,
// a note on each item, and the safety rules around them.
// Run with: npm test

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { daysFromToday, orderFor, startTestServer } from './helpers.js'

let server
let auth
let cake
let cookies
let soldOut

before(async () => {
  server = await startTestServer()
  auth = { Authorization: `Bearer ${server.adminToken}` }

  const add = async (fields) => {
    const res = await server.api().post('/api/products').set(auth).send({ unit: 'piece', ...fields })
    assert.equal(res.status, 201, res.body.message)
    return res.body
  }
  cake = await add({ name: 'Red Velvet Cake', category: 'cakes', price: 700 })
  cookies = await add({
    name: 'Cookie Box', category: 'cookies', price: 300,
    isSpecial: true, specialTag: 'Diwali Special', offerPrice: 250, specialEnd: daysFromToday(5),
  })
  soldOut = await add({ name: 'Gone Brownie', category: 'desserts', price: 120, available: false })
})

after(() => server.stop())

const placeOrder = (items, extra) => server.api().post('/api/orders').send(orderFor(items, extra))
const allOrders = async () => (await server.api().get('/api/orders').set(auth)).body

describe('One order with several items', () => {
  test('the total adds up every line, using offer prices for active specials', async () => {
    const res = await placeOrder([
      { slug: cake.slug, qty: 1 },
      { slug: cookies.slug, qty: 2 },
    ])
    assert.equal(res.status, 201, res.body.message)
    assert.equal(res.body.total, 700 + 2 * 250)
    assert.match(res.body.orderNumber, /^PNP-\d+$/)
  })

  test('each item keeps its own note, and the same item can be added twice with different notes', async () => {
    const res = await placeOrder([
      { slug: cake.slug, qty: 1, note: 'Happy Birthday Riya!' },
      { slug: cake.slug, qty: 1, note: 'Happy Anniversary!' },
    ])
    assert.equal(res.status, 201, res.body.message)

    const saved = (await allOrders()).find((o) => o.orderNumber === res.body.orderNumber)
    assert.deepEqual(saved.items.map((i) => i.note), ['Happy Birthday Riya!', 'Happy Anniversary!'])
    assert.equal(saved.total, 1400)
  })

  test('Track order does not show item notes (they can be private, like a cake message)', async () => {
    const placed = await placeOrder([{ slug: cake.slug, qty: 1, note: 'Secret surprise for Asha' }])
    const res = await server.api().post('/api/orders/track').send({ number: placed.body.orderNumber, phone: '9876543210' })
    assert.equal(res.status, 200)
    assert.equal(res.body.items[0].name, 'Red Velvet Cake')
    assert.equal(res.body.items[0].note, undefined)
  })
})

describe('Cart safety rules', () => {
  test('one sold-out item stops the whole order, and nothing is saved', async () => {
    const before = (await allOrders()).length
    const res = await placeOrder([
      { slug: cake.slug, qty: 1 },
      { slug: soldOut.slug, qty: 1 },
    ])
    assert.equal(res.status, 400)
    assert.match(res.body.message, /sold out/)
    assert.equal((await allOrders()).length, before)
  })

  test('more than 20 different lines is refused', async () => {
    const lines = Array.from({ length: 21 }, () => ({ slug: cake.slug, qty: 1 }))
    const res = await placeOrder(lines)
    assert.equal(res.status, 400)
    assert.match(res.body.message, /at most 20/)
  })

  test('an item note longer than 200 characters is refused', async () => {
    const res = await placeOrder([{ slug: cake.slug, qty: 1, note: 'x'.repeat(201) }])
    assert.equal(res.status, 400)
    assert.match(res.body.message, /too long/)
  })

  test('an empty cart is refused', async () => {
    const res = await placeOrder([])
    assert.equal(res.status, 400)
    assert.match(res.body.message, /empty/)
  })
})
