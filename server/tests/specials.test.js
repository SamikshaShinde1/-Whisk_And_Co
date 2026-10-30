// Tests for special offers: the admin rules, when an offer counts as "active",
// and that orders use the offer price only while the offer is running.
// Run with: npm test

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { daysFromToday, orderFor, startTestServer } from './helpers.js'

let server
let auth

before(async () => {
  server = await startTestServer()
  auth = { Authorization: `Bearer ${server.adminToken}` }
})

after(() => server.stop())

// Adds an item through the admin API and returns it
async function addItem(fields) {
  const res = await server.api()
    .post('/api/products')
    .set(auth)
    .send({ category: 'cakes', price: 500, unit: '500 g', ...fields })
  assert.equal(res.status, 201, res.body.message)
  return res.body
}

describe('Admin rules for specials', () => {
  test('a special needs a tag', async () => {
    const res = await server.api().post('/api/products').set(auth)
      .send({ name: 'No Tag Cake', category: 'cakes', price: 500, unit: 'piece', isSpecial: true })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /tag/)
  })

  test('the offer price must be lower than the normal price', async () => {
    const res = await server.api().post('/api/products').set(auth)
      .send({ name: 'Pricey Cake', category: 'cakes', price: 500, unit: 'piece', isSpecial: true, specialTag: 'Diwali Special', offerPrice: 600 })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /lower than the normal price/)
  })

  test('the end date cannot be before the start date', async () => {
    const res = await server.api().post('/api/products').set(auth)
      .send({
        name: 'Backwards Cake', category: 'cakes', price: 500, unit: 'piece',
        isSpecial: true, specialTag: 'Diwali Special', specialStart: daysFromToday(5), specialEnd: daysFromToday(2),
      })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /end on or after/)
  })

  test('editing only the price is still checked against the offer price', async () => {
    const item = await addItem({ name: 'Edit Check Cake', isSpecial: true, specialTag: 'Diwali Special', offerPrice: 400 })
    const res = await server.api().put(`/api/products/${item._id}`).set(auth).send({ price: 300 })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /lower than the normal price/)
  })

  test('customers cannot create specials', async () => {
    const res = await server.api().post('/api/products')
      .send({ name: 'Sneaky Cake', category: 'cakes', price: 500, unit: 'piece', isSpecial: true, specialTag: 'Free', offerPrice: 1 })
    assert.equal(res.status, 401)
  })
})

describe('When is a special active?', () => {
  test('only between its start and end dates (both included)', async () => {
    await addItem({ name: 'Running Cake', isSpecial: true, specialTag: 'Diwali Special', offerPrice: 450, specialStart: daysFromToday(0), specialEnd: daysFromToday(0) })
    await addItem({ name: 'Future Cake', isSpecial: true, specialTag: 'Christmas Special', offerPrice: 450, specialStart: daysFromToday(10) })
    await addItem({ name: 'Ended Cake', isSpecial: true, specialTag: 'Holi Special', offerPrice: 450, specialEnd: daysFromToday(-1) })
    await addItem({ name: 'Switched Off Cake', isSpecial: false, specialTag: 'Diwali Special', offerPrice: 450 })

    const res = await server.api().get('/api/products')
    const active = (name) => res.body.find((p) => p.name === name).specialActive

    assert.equal(active('Running Cake'), true)
    assert.equal(active('Future Cake'), false)
    assert.equal(active('Ended Cake'), false)
    assert.equal(active('Switched Off Cake'), false)
  })
})

describe('Orders use the right price', () => {
  test('an active special is charged at its offer price', async () => {
    const item = await addItem({ name: 'Diwali Barfi Cake', isSpecial: true, specialTag: 'Diwali Special', offerPrice: 399, specialEnd: daysFromToday(7) })
    const res = await server.api().post('/api/orders').send(orderFor([{ slug: item.slug, qty: 2 }]))
    assert.equal(res.status, 201, res.body.message)
    assert.equal(res.body.total, 798)
  })

  test('a special that has not started yet is charged at the normal price', async () => {
    const item = await addItem({ name: 'Early Bird Cake', isSpecial: true, specialTag: 'New Year Special', offerPrice: 399, specialStart: daysFromToday(2) })
    const res = await server.api().post('/api/orders').send(orderFor([{ slug: item.slug, qty: 1 }]))
    assert.equal(res.status, 201, res.body.message)
    assert.equal(res.body.total, 500)
  })

  test('a special that has ended is charged at the normal price', async () => {
    const item = await addItem({ name: 'Late Cake', isSpecial: true, specialTag: 'Holi Special', offerPrice: 399, specialEnd: daysFromToday(-2) })
    const res = await server.api().post('/api/orders').send(orderFor([{ slug: item.slug, qty: 1 }]))
    assert.equal(res.status, 201, res.body.message)
    assert.equal(res.body.total, 500)
  })

  test('prices and totals sent by the browser are ignored', async () => {
    const item = await addItem({ name: 'Honest Cake', isSpecial: true, specialTag: 'Diwali Special', offerPrice: 450 })
    const res = await server.api().post('/api/orders')
      .send(orderFor([{ slug: item.slug, qty: 1, price: 1 }], { total: 1 }))
    assert.equal(res.status, 201, res.body.message)
    assert.equal(res.body.total, 450)
  })
})
