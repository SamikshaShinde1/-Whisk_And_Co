// Shared set-up for the backend tests.
// Each test file gets its own temporary MongoDB in memory, so tests never touch the real database.

import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import '../config/db.js' // same safety setting (sanitizeFilter) as the real server
import { createApp } from '../app.js'
import { todayInIndia } from '../utils/indiaTime.js'

// Starts a temporary MongoDB. It normally starts in about a second, but on Windows it now and then
// never reports "ready", so we wait at most 30 seconds and try again (up to 3 times).
// (The first run also downloads MongoDB once; that download is not counted in the 30 seconds.)
async function startMemoryMongo(tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } })
    } catch (err) {
      if (attempt >= tries) throw err
      console.warn(`Test database did not start (try ${attempt} of ${tries}), trying again…`)
    }
  }
}

// options.now: a fake clock, e.g. () => new Date('2026-11-01T04:30:00Z')
// options.notifyOrder: a pretend "email the owner" (by default it does nothing, so tests never send real email)
export async function startTestServer({ notifyOrder = async () => {}, ...options } = {}) {
  process.env.JWT_SECRET = 'test-secret-only-for-tests'

  const mongo = await startMemoryMongo()
  await mongoose.connect(mongo.getUri())

  const app = createApp({ notifyOrder, ...options })
  const adminToken = jwt.sign({ id: new mongoose.Types.ObjectId().toString() }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })

  return {
    api: () => request(app),
    adminToken,
    async stop() {
      await mongoose.disconnect()
      await mongo.stop()
    },
  }
}

// A date N days from today in India, as "YYYY-MM-DD" (negative = in the past)
export function daysFromToday(days) {
  const [y, m, d] = todayInIndia().split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

// The details every test order needs (pickup, so no address)
export function orderFor(items, extra = {}) {
  return {
    customerName: 'Test Customer',
    phone: '9876543210',
    deliveryType: 'pickup',
    date: daysFromToday(3),
    items,
    ...extra,
  }
}
