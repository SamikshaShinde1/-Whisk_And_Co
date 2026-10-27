import mongoose from 'mongoose'

// The bakery owner's login. The password is stored as a bcrypt hash, never as plain text.
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
  },
  { timestamps: true },
)

export default mongoose.model('Admin', adminSchema)
