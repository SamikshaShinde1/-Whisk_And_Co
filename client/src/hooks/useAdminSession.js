import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAdmin, getAdmin } from '../adminAuth'

// Shared by the admin pages: who is logged in, log out, and "was this error a logged-out error?"
export default function useAdminSession() {
  const navigate = useNavigate()
  const [admin] = useState(getAdmin)

  const logout = useCallback(
    (message) => {
      clearAdmin()
      navigate('/admin/login', { replace: true, state: message ? { message } : undefined })
    },
    [navigate],
  )

  // An expired or invalid token sends you back to the login page.
  // Returns true when it did that, so the page knows not to show the error itself.
  const handleSessionError = useCallback(
    (err) => {
      if (err.status !== 401) return false
      logout('Your session has expired. Please log in again.')
      return true
    },
    [logout],
  )

  return { admin, logout, handleSessionError }
}
