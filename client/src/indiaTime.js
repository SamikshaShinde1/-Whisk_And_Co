// The bakery is in India, so "today" always means today in India (Asia/Kolkata),
// even if the visitor's phone is set to another time zone.
// The server has a copy of these rules in server/utils/indiaTime.js – keep the two the same.
// (The server checks every order again, so these are here to give quick, friendly messages.)

const TIME_ZONE = 'Asia/Kolkata'
export const SUNDAY_DEADLINE = '20:00' // Sunday orders must be placed by Saturday 8 PM

// The date and time in India right now: { date: '2026-11-01', time: '14:05' }
export function nowInIndia(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

// Today's date in India as "YYYY-MM-DD"
export function todayInIndia(now = new Date()) {
  return nowInIndia(now).date
}

// "2026-11-01" plus 1 day -> "2026-11-02"
export function addDays(date, days) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function isSunday(date) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0
}

// Is it Sunday in India right now?
export function isSundayInIndia(now = new Date()) {
  return isSunday(todayInIndia(now))
}

// The first date a customer can choose: today, or Monday when today is a Sunday
export function earliestOrderDate(now = new Date()) {
  const today = todayInIndia(now)
  return isSunday(today) ? addDays(today, 1) : today
}

// Checks a pickup / delivery date against the bakery's rules.
// Returns '' when the date is fine, or a friendly message explaining why it isn't.
//   1. Past dates are never allowed.
//   2. On a Sunday there are no same-day orders (pre-orders for Monday onwards only).
//   3. A Sunday date is only allowed if the order is placed by Saturday 8 PM.
export function orderDateProblem(date, now = new Date()) {
  const { date: today, time } = nowInIndia(now)

  if (date < today) {
    return 'That date has already passed. Please choose today or a later date.'
  }
  if (date === today && isSunday(today)) {
    return "We're closed for same-day orders on Sundays. Please choose Monday or a later date."
  }
  if (isSunday(date)) {
    const saturday = addDays(date, -1)
    const tooLate = today > saturday || (today === saturday && time >= SUNDAY_DEADLINE)
    if (tooLate) {
      return 'Orders for Sunday must be placed by Saturday 8 PM. Please choose Monday or a later date.'
    }
  }
  return ''
}

// "2026-11-05" -> "5 Nov"
export function formatDay(date) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
