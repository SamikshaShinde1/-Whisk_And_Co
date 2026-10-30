// The bakery is in India, so "today" always means today in India (Asia/Kolkata),
// even when the server runs somewhere else (Render's servers use UTC time).

// Today's date in India as "YYYY-MM-DD" (the same format the order form and the offer dates use)
export function todayInIndia(now = new Date()) {
  // The "en-CA" format happens to be YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)
}
