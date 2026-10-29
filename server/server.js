// Entry point of the backend: sets up Express, connects to MongoDB and starts listening.

import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import orderRoutes from './routes/orders.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import { notFound, errorHandler } from './middleware/errors.js'

dotenv.config({ quiet: true }) // loads the values from server/.env into process.env

// Stop early with a clear message if a required setting is missing
for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`❌ Missing ${name} in server/.env (see server/.env.example)`)
    process.exit(1)
  }
}

const app = express()
const PORT = process.env.PORT || 5000

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

await connectDB(process.env.MONGO_URI)
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
