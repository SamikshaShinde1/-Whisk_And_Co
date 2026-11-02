// Tests for the "new order" email to the owner.
// No real email is ever sent: the tests use a pretend email function, or a pretend fetch.
// Run with: npm test

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import Order from '../models/Order.js'
import { buildOrderEmail, sendOrderEmail } from '../utils/orderEmail.js'
import { orderFor, startTestServer } from './helpers.js'

let server
let notify // what the pretend "email the owner" does in the current test

before(async () => {
  server = await startTestServer({ notifyOrder: (order) => notify(order) })
  const res = await server
    .api()
    .post('/api/products')
    .set({ Authorization: `Bearer ${server.adminToken}` })
    .send({ name: 'Red Velvet Cake', category: 'cakes', price: 700, unit: 'piece' })
  assert.equal(res.status, 201, res.body.message)
})

after(() => server.stop())

const placeOrder = () => server.api().post('/api/orders').send(orderFor([{ slug: 'red-velvet-cake', qty: 2, note: 'Happy Birthday!' }]))

// The email is sent just after the answer, so wait a moment for it
const waitFor = async (check) => {
  for (let i = 0; i < 50 && !check(); i++) await new Promise((resolve) => setTimeout(resolve, 10))
}

const SAMPLE = {
  orderNumber: 'PNP-1042',
  customerName: 'Riya <b>Shah</b>',
  phone: '9876543210',
  items: [
    { name: 'Red Velvet Cake', price: 700, qty: 2, note: 'Happy Birthday!' },
    { name: 'Cookie Box', price: 250, qty: 1, note: '' },
  ],
  total: 1650,
  deliveryType: 'delivery',
  address: 'Flat 4, Rose Lane',
  date: '2026-11-02',
  note: 'Call when you arrive',
}

describe('the email itself', () => {
  test('has the order number, name, phone, items, total, pickup/delivery and date', () => {
    const { subject, text } = buildOrderEmail(SAMPLE)
    assert.match(subject, /PNP-1042/)
    for (const part of ['PNP-1042', 'Riya', '9876543210', '2 × Red Velvet Cake', 'Happy Birthday!', '1 × Cookie Box', '₹1,650', 'Delivery on Mon, 2 Nov, 2026', 'Flat 4, Rose Lane', 'Call when you arrive']) {
      assert.ok(text.includes(part), `missing "${part}"`)
    }
  })

  test('customer text cannot add HTML to the email', () => {
    const { html } = buildOrderEmail(SAMPLE)
    assert.ok(html.includes('Riya &lt;b&gt;Shah&lt;/b&gt;'))
    assert.ok(!html.includes('<b>Shah</b>'))
  })

  test('a pickup order says Pickup', () => {
    assert.match(buildOrderEmail({ ...SAMPLE, deliveryType: 'pickup', address: '' }).text, /Pickup on Mon, 2 Nov, 2026/)
  })
})

describe('placing an order', () => {
  test('the owner is told about the saved order', async () => {
    let emailed = null
    notify = async (order) => {
      emailed = order
    }
    const res = await placeOrder()
    assert.equal(res.status, 201, res.body.message)
    await waitFor(() => emailed)
    assert.equal(emailed?.orderNumber, res.body.orderNumber)
    assert.equal(emailed.items[0].note, 'Happy Birthday!')
  })

  test('if the email fails, the order is STILL saved and the error is only logged', async (t) => {
    const logged = t.mock.method(console, 'error', () => {})

    for (const failure of [
      async () => { throw new Error('Resend is down') }, // fails later
      () => { throw new Error('Broke straight away') }, // fails at once
    ]) {
      notify = failure
      const res = await placeOrder()
      assert.equal(res.status, 201, res.body.message)
      assert.ok(await Order.exists({ orderNumber: res.body.orderNumber }), 'the order must be in the database')
    }

    await waitFor(() => logged.mock.callCount() === 2)
    assert.equal(logged.mock.callCount(), 2)
    assert.match(logged.mock.calls[0].arguments.join(' '), /failed.*Resend is down/)
  })
})

describe('sending with Resend', () => {
  test('without the keys in .env it skips quietly', async (t) => {
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('{}'))
    delete process.env.RESEND_API_KEY
    delete process.env.ORDER_EMAIL_TO
    await sendOrderEmail(SAMPLE)
    assert.equal(fetch.mock.callCount(), 0)
  })

  test('with the keys it calls Resend, and throws a clear error if Resend says no', async (t) => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.ORDER_EMAIL_TO = 'owner@example.com'
    t.after(() => {
      delete process.env.RESEND_API_KEY
      delete process.env.ORDER_EMAIL_TO
    })

    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('{"id":"1"}', { status: 200 }))
    await sendOrderEmail(SAMPLE)
    const [url, options] = fetch.mock.calls[0].arguments
    assert.equal(url, 'https://api.resend.com/emails')
    assert.equal(options.headers.Authorization, 'Bearer re_test_key')
    const body = JSON.parse(options.body)
    assert.deepEqual(body.to, ['owner@example.com'])
    assert.match(body.subject, /PNP-1042/)

    fetch.mock.mockImplementation(async () => new Response('{"message":"API key is invalid"}', { status: 401 }))
    await assert.rejects(sendOrderEmail(SAMPLE), /401: API key is invalid/)
  })
})
