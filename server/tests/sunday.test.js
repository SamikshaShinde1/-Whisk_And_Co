// Tests for the Sunday rule ("Sunday: pre-orders only") and other date rules.
// A fake clock lets us pretend it is any day and time, in Indian time (UTC + 5:30).
// Run with: npm test

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { orderFor, startTestServer } from './helpers.js'
import { isSunday, orderDateProblem } from '../utils/indiaTime.js'

// A calendar to work with: Saturday 31 Oct, Sunday 1 Nov, Monday 2 Nov 2026
const SATURDAY = '2026-10-31'
const SUNDAY = '2026-11-01'
const MONDAY = '2026-11-02'
const NEXT_SUNDAY = '2026-11-08'

// A moment in India, e.g. india('2026-11-01', '10:00')
const india = (date, time) => new Date(`${date}T${time}:00+05:30`)

let server
let fakeNow
let cake

before(async () => {
  server = await startTestServer({ now: () => fakeNow })
  const res = await server.api().post('/api/products')
    .set({ Authorization: `Bearer ${server.adminToken}` })
    .send({ name: 'Plain Sponge Cake', category: 'cakes', price: 400, unit: '500 g' })
  cake = res.body
})

after(() => server.stop())

// Places an order for `date` while the clock says `now`
function orderAt(now, date) {
  fakeNow = now
  return server.api().post('/api/orders').send(orderFor([{ slug: cake.slug, qty: 1 }], { date }))
}

test('the calendar used in these tests is right', () => {
  assert.equal(isSunday(SUNDAY), true)
  assert.equal(isSunday(NEXT_SUNDAY), true)
  assert.equal(isSunday(SATURDAY), false)
})

describe('Ordering on a Sunday', () => {
  test('an order for the same Sunday is rejected', async () => {
    const res = await orderAt(india(SUNDAY, '10:00'), SUNDAY)
    assert.equal(res.status, 400)
    assert.match(res.body.message, /same-day orders on Sundays/)
  })

  test('an order for Monday is accepted', async () => {
    const res = await orderAt(india(SUNDAY, '10:00'), MONDAY)
    assert.equal(res.status, 201, res.body.message)
  })

  test('Indian time is used: Sunday 00:30 in India is still Saturday in UTC, but same-day is refused', async () => {
    // 2026-10-31T19:00Z is Saturday in UTC and 00:30 on Sunday in India
    const res = await orderAt(new Date('2026-10-31T19:00:00Z'), SUNDAY)
    assert.equal(res.status, 400)
    assert.match(res.body.message, /same-day orders on Sundays/)
  })
})

describe('Ordering FOR a Sunday (a pre-order)', () => {
  test('placed on Saturday before 8 PM: accepted', async () => {
    const res = await orderAt(india(SATURDAY, '19:59'), SUNDAY)
    assert.equal(res.status, 201, res.body.message)
  })

  test('placed on Saturday at 8 PM or later: rejected', async () => {
    const res = await orderAt(india(SATURDAY, '20:00'), SUNDAY)
    assert.equal(res.status, 400)
    assert.match(res.body.message, /by Saturday 8 PM/)
  })

  test('placed during the week for next Sunday: accepted', async () => {
    const res = await orderAt(india(MONDAY, '09:00'), NEXT_SUNDAY)
    assert.equal(res.status, 201, res.body.message)
  })
})

describe('Other dates', () => {
  test('a past date is rejected', async () => {
    const res = await orderAt(india(MONDAY, '10:00'), SATURDAY)
    assert.equal(res.status, 400)
    assert.match(res.body.message, /already passed/)
  })

  // (one test for both, because the server allows only 10 orders per visitor every 15 minutes)
  test('a same-day order on a weekday is accepted, and a rejected date does not use up an order number', async () => {
    const first = await orderAt(india(MONDAY, '10:00'), MONDAY)
    assert.equal(first.status, 201, first.body.message)
    await orderAt(india(MONDAY, '10:00'), SATURDAY) // rejected (past)
    const second = await orderAt(india(MONDAY, '10:00'), MONDAY)
    const number = (res) => Number(res.body.orderNumber.split('-')[1])
    assert.equal(number(second), number(first) + 1)
  })
})

describe('The rule itself (no server needed)', () => {
  test('Saturday 7:59 PM is fine for Sunday, Saturday 8:00 PM is not', () => {
    assert.equal(orderDateProblem(SUNDAY, india(SATURDAY, '19:59')), '')
    assert.notEqual(orderDateProblem(SUNDAY, india(SATURDAY, '20:00')), '')
  })

  test('on Sunday, Monday is the earliest allowed date', () => {
    assert.notEqual(orderDateProblem(SUNDAY, india(SUNDAY, '08:00')), '')
    assert.equal(orderDateProblem(MONDAY, india(SUNDAY, '23:59')), '')
  })
})
