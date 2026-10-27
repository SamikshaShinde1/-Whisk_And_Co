import jwt from 'jsonwebtoken'

// Lets a request through only if it carries a valid admin token:
//   Authorization: Bearer <token>
export default function requireAdmin(req, res, next) {
  const [type, token] = (req.headers.authorization || '').split(' ')

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please log in first.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    req.adminId = payload.id
    next()
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please log in again.' })
  }
}
