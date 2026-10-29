// Remembers the logged-in admin ({ token, email }) in the browser, so you stay logged in.

const KEY = 'pnp-admin'

export function getAdmin() {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function saveAdmin(admin) {
  try {
    localStorage.setItem(KEY, JSON.stringify(admin))
  } catch {
    // storage blocked (e.g. private mode) – you'll just need to log in again next time
  }
}

export function clearAdmin() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
