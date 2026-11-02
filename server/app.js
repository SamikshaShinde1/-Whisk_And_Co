// Builds the Express app: settings, routes and error handling.
// server.js runs it for real; the tests run it against a temporary database.

import express from 'express'
import cors from 'cors'
import orderRoutes from './routes/orders.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import { notFound, errorHandler } from './middleware/errors.js'

// A function (not a ready-made app), so it reads CLIENT_URL only after server/.env is loaded.
// "now" gives the current time; tests pass a fake clock to check the Sunday rules on any day.
export function createApp({ now = () => new Date() } = {}) {
  const app = express()
  app.locals.now = now

  // Which websites may call this API (comma-separated list in CLIENT_URL)
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))

  app.set('trust proxy', 1) // needed on Render so rate limits see the real visitor IP
  app.use(cors({ origin: allowedOrigins }))
  app.use(express.json({ limit: '20kb' })) // read JSON bodies (and refuse huge ones)

  // Health check – handy for testing and for Render
  app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Pastel n Postery API is running 🧁' })
  })

  app.use('/api/orders', orderRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/products', productRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
