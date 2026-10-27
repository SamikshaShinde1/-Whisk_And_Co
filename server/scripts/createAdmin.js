// Creates (or updates) the admin login from ADMIN_EMAIL and ADMIN_PASSWORD in server/.env.
// Run from the server folder:  npm run create-admin

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/db.js'
import Admin from '../models/Admin.js'

dotenv.config({ quiet: true })

const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Please set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.')
  process.exit(1)
}
if (ADMIN_PASSWORD.length < 8) {
  console.error('❌ ADMIN_PASSWORD must be at least 8 characters long.')
  process.exit(1)
}

await connectDB(MONGO_URI)

const email = ADMIN_EMAIL.toLowerCase().trim()
const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)

// "upsert" = update the admin if it exists, otherwise create it
await Admin.findOneAndUpdate({ email }, { email, password: hashedPassword }, { upsert: true })

console.log(`✅ Admin account ready for ${email}`)
console.log('   Tip: you can now delete ADMIN_PASSWORD from server/.env – it is only needed for this script.')

await mongoose.disconnect()
