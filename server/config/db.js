import mongoose from 'mongoose'

// Removes "$" operators from query filters, so user input can't change what a query means.
mongoose.set('sanitizeFilter', true)

// Connects to MongoDB Atlas using the link from server/.env
export async function connectDB(uri) {
  try {
    await mongoose.connect(uri)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ Could not connect to MongoDB:', error.message)
    console.error('   Check MONGO_URI in server/.env and that your IP is allowed in Atlas → Network Access.')
    process.exit(1)
  }
}
