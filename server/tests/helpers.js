// Shared set-up for the backend tests.
// Each test file gets its own temporary MongoDB in memory, so tests never touch the real database.

import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import '../config/db.js' // same safety setting (sanitizeFilter) as the real server
import { createApp } from '../app.js'
import { todayInIndia } from '../utils/indiaTime.js'

// options.now: a fake clock, e.g. () => new Date('2026-11-01T04:30:00Z')
export async function startTestServer(options = {}) {
  process.env.JWT_SECRET = 'test-secret-only-for-tests'

  // The first run downloads MongoDB once, so allow plenty of time
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 180000 } })
  await mongoose.connect(mongo.getUri())

  const app = createApp(options)
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
