// Entry point of the backend: loads server/.env, connects to MongoDB and starts listening.
// (The routes and settings are in app.js.)

import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import { createApp } from './app.js'

dotenv.config({ quiet: true }) // loads the values from server/.env into process.env

// Stop early with a clear message if a required setting is missing
for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`❌ Missing ${name} in server/.env (see server/.env.example)`)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 5000
const app = createApp()

await connectDB(process.env.MONGO_URI)
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
