// Copies the starting menu from client/src/data/menu.js into MongoDB.
// Run once from the server folder:  npm run seed-products
//
// Safe to run again: items that are already in the database are skipped,
// so changes made on the "Manage menu" page are never overwritten.

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Product from '../models/Product.js'
import { MENU } from '../../client/src/data/menu.js'

dotenv.config({ quiet: true })

if (!process.env.MONGO_URI) {
  console.error('❌ Please set MONGO_URI in server/.env first.')
  process.exit(1)
}

await connectDB(process.env.MONGO_URI)

let added = 0
// One by one, in menu order, so the menu keeps the same order on the website
for (const item of MENU) {
  if (await Product.exists({ slug: item.id })) continue

  await Product.create({
    slug: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    priceFrom: Boolean(item.priceFrom),
    unit: item.unit,
    description: item.description,
    image: item.image,
    bestSeller: Boolean(item.bestSeller),
    available: true,
  })
  added++
}

console.log(`✅ Added ${added} items (${MENU.length - added} were already in the database).`)
await mongoose.disconnect()
