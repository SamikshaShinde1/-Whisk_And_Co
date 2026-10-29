import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = Router()

const MIN_PASSWORD_LENGTH = 8

// Stops password guessing: at most 5 tries every 15 minutes
const passwordLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
  })

// POST /api/auth/login – admin logs in and gets a token (valid for 7 days)
router.post('/login', passwordLimiter(), async (req, res) => {
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

// PATCH /api/auth/password – the logged-in admin changes their own password
router.patch('/password', requireAdmin, passwordLimiter(), async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ message: 'Please fill in both passwords.' })
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.` })
  }

  const admin = await Admin.findById(req.adminId)
  const passwordOk = admin && (await bcrypt.compare(currentPassword, admin.password))
  // 400 (not 401) so the website doesn't log you out for a typo
  if (!passwordOk) {
    return res.status(400).json({ message: 'Your current password is not correct.' })
  }

  admin.password = await bcrypt.hash(newPassword, 12)
  await admin.save()
  res.json({ message: 'Password changed.' })
})

export default router
