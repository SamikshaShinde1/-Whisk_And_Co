import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { FiLock } from 'react-icons/fi'
import LogoMark from '../../components/LogoMark'
import { login } from '../../api'
import { getAdmin, saveAdmin } from '../../adminAuth'
import usePageTitle from '../../hooks/usePageTitle'
import './Admin.css'

export default function AdminLogin() {
  usePageTitle('Admin login')
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  // A message passed from the orders page, e.g. "Your session has expired"
  const [error, setError] = useState(location.state?.message || '')

  // Already logged in? Go straight to the orders.
  if (getAdmin()) return <Navigate to="/admin/orders" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      const admin = await login(email, password)
      saveAdmin(admin)
      navigate('/admin/orders', { replace: true })
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <section className="admin-login">
      <motion.form
        className="admin-login__card"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <LogoMark size={72} />
        <span className="script">welcome back</span>
        <h1>Admin login</h1>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>

        {error && <p className="admin__error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-dark" disabled={sending}>
          <FiLock /> {sending ? 'Logging in…' : 'Log in'}
        </button>
      </motion.form>
    </section>
  )
}
