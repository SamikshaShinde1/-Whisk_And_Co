// The bakery is in India, so "today" always means today in India (Asia/Kolkata),
// even if the visitor's phone is set to another time zone. The server uses the same rule.

// Today's date in India as "YYYY-MM-DD"
export function todayInIndia(now = new Date()) {
  // The "en-CA" format happens to be YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)
}

// "2026-11-05" -> "5 Nov"
export function formatDay(date) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
