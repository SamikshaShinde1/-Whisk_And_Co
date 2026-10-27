import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const router = Router()

// Stops password guessing: at most 5 login tries every 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
})

// POST /api/auth/login – admin logs in and gets a token (valid for 7 days)
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Please enter your email and password.' })
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() })
  const passwordOk = admin && (await bcrypt.compare(password, admin.password))

  // Same message for "no such email" and "wrong password", so we don't reveal which one it was
  if (!passwordOk) {
    return res.status(401).json({ message: 'Wrong email or password.' })
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, email: admin.email })
})

export default router
