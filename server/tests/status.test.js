// Tests for the one-way order status: new → baking → ready → delivered (forward only),
// "cancelled" only from new or baking, and "delivered" / "cancelled" are final.
// Run with: npm test

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import Order from '../models/Order.js'
import { daysFromToday, startTestServer } from './helpers.js'

let server
let auth

before(async () => {
  server = await startTestServer()
  auth = { Authorization: `Bearer ${server.adminToken}` }
})

after(() => server.stop())

// Saves an order straight into the database with the given status
// (no POST /api/orders, so these tests don't hit the order rate limit)
async function orderWithStatus(status) {
  const order = await Order.create({
    customerName: 'Test Customer',
    phone: '9876543210',
    items: [{ name: 'Red Velvet Cake', price: 700, qty: 1 }],
    date: daysFromToday(3),
    total: 700,
    status,
  })
  return order._id.toString()
}

const changeStatus = (id, status) => server.api().patch(`/api/orders/${id}`).set(auth).send({ status })

// Checks that a change is refused with a 400 and a message, and the order keeps its old status
async function assertRefused(from, to, messagePart) {
  const id = await orderWithStatus(from)
  const res = await changeStatus(id, to)
  assert.equal(res.status, 400, `${from} → ${to} should be refused`)
  assert.match(res.body.message, messagePart)
  assert.equal((await Order.findById(id)).status, from, 'the saved status must not change')
}

describe('moving forward', () => {
  test('an order goes new → baking → ready → delivered', async () => {
    const id = await orderWithStatus('new')
    for (const status of ['baking', 'ready', 'delivered']) {
      const res = await changeStatus(id, status)
      assert.equal(res.status, 200, res.body.message)
      assert.equal(res.body.status, status)
    }
    assert.equal((await Order.findById(id)).status, 'delivered')
  })

  test('skipping forward is allowed (new → ready, baking → delivered)', async () => {
    let res = await changeStatus(await orderWithStatus('new'), 'ready')
    assert.equal(res.status, 200, res.body.message)
    res = await changeStatus(await orderWithStatus('baking'), 'delivered')
    assert.equal(res.status, 200, res.body.message)
  })

  test('choosing the same status again is harmless', async () => {
    const res = await changeStatus(await orderWithStatus('baking'), 'baking')
    assert.equal(res.status, 200, res.body.message)
    assert.equal(res.body.status, 'baking')
  })
})

describe('moving backward is refused', () => {
  test('ready → baking', () => assertRefused('ready', 'baking', /only move forward/))
  test('baking → new', () => assertRefused('baking', 'new', /only move forward/))
})

describe('final statuses can never change', () => {
  test('delivered → new (the original bug)', () => assertRefused('delivered', 'new', /already delivered/))
  test('delivered → cancelled', () => assertRefused('delivered', 'cancelled', /already delivered/))
  test('cancelled → new', () => assertRefused('cancelled', 'new', /was cancelled/))
  test('cancelled → delivered', () => assertRefused('cancelled', 'delivered', /was cancelled/))
})

describe('cancelling', () => {
  test('a new order can be cancelled', async () => {
    const res = await changeStatus(await orderWithStatus('new'), 'cancelled')
    assert.equal(res.status, 200, res.body.message)
    assert.equal(res.body.status, 'cancelled')
  })

  test('a baking order can be cancelled', async () => {
    const res = await changeStatus(await orderWithStatus('baking'), 'cancelled')
    assert.equal(res.status, 200, res.body.message)
  })

  test('a ready order can NOT be cancelled', () => assertRefused('ready', 'cancelled', /Only new or baking/))
})

describe('other safety checks', () => {
  test('an unknown status is refused', () => assertRefused('new', 'eaten', /Status must be one of/))

  test('without the admin login, nothing changes', async () => {
    const id = await orderWithStatus('new')
    const res = await server.api().patch(`/api/orders/${id}`).send({ status: 'baking' })
    assert.equal(res.status, 401)
    assert.equal((await Order.findById(id)).status, 'new')
  })

  test('a customer tracking a cancelled order sees "cancelled"', async () => {
    const order = await Order.create({
      orderNumber: 'PNP-5001',
      customerName: 'Test Customer',
      phone: '9876543210',
      items: [{ name: 'Red Velvet Cake', price: 700, qty: 1 }],
      date: daysFromToday(3),
      total: 700,
    })
    assert.equal((await changeStatus(order._id.toString(), 'cancelled')).status, 200)

    const res = await server.api().post('/api/orders/track').send({ number: 'PNP-5001', phone: '9876543210' })
    assert.equal(res.status, 200)
    assert.equal(res.body.status, 'cancelled')
  })
})
