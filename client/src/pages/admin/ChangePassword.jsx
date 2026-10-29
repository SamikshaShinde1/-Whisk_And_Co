import { useState } from 'react'
import { motion } from 'motion/react'
import { FiCheckCircle } from 'react-icons/fi'
import { changePassword } from '../../api'

const EMPTY = { current: '', next: '', confirm: '' }

// Small form on the orders page so the bakery owner can set their own password.
export default function ChangePassword({ token, onAuthError, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState('idle') // idle | saving | done
  const [error, setError] = useState('')

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.next !== form.confirm) {
      setError('The two new passwords are not the same.')
      return
    }
    setStatus('saving')
    setError('')
    try {
      await changePassword(form.current, form.next, token)
      setForm(EMPTY)
      setStatus('done')
    } catch (err) {
      setStatus('idle')
      if (err.status === 401) onAuthError(err)
      else setError(err.message)
    }
  }

  return (
    <motion.div
      className="admin__password"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {status === 'done' ? (
        <div className="admin__password-done" role="status">
          <FiCheckCircle aria-hidden="true" />
          <p>Password changed! Use your new password next time you log in.</p>
          <button className="btn btn-dark" onClick={onClose}>Close</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2>Change password</h2>
          <div className="admin__password-grid">
            <label className="field">
              <span>Current password</span>
              <input type="password" name="current" value={form.current} onChange={update} required autoComplete="current-password" />
            </label>
            <label className="field">
              <span>New password <em>(at least 8 characters)</em></span>
              <input type="password" name="next" value={form.next} onChange={update} required minLength={8} autoComplete="new-password" />
            </label>
            <label className="field">
              <span>Type new password again</span>
              <input type="password" name="confirm" value={form.confirm} onChange={update} required minLength={8} autoComplete="new-password" />
            </label>
          </div>

          {error && <p className="admin__error" role="alert">{error}</p>}

          <div className="admin__password-actions">
            <button type="submit" className="btn btn-dark" disabled={status === 'saving'}>
              {status === 'saving' ? 'Saving…' : 'Save new password'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      )}
    </motion.div>
  )
}
