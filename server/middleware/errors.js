// Any URL that doesn't match a route
export function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` })
}

// One place that turns errors into friendly JSON responses.
// (Express 5 sends errors from async routes here automatically.)
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Data didn't pass the rules in the model (e.g. phone not 10 digits)
  if (err.name === 'ValidationError') {
    const firstProblem = Object.values(err.errors)[0]
    return res.status(400).json({ message: firstProblem?.message || 'Some details are not valid.' })
  }
  // An id in the URL that isn't a valid MongoDB id
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id.' })
  }
  // Broken JSON in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request.' })
  }
  // Photo upload problems (multer)
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'That photo is too big. Please use one under 5 MB.' : 'Could not read that photo.'
    return res.status(400).json({ message })
  }
  // Two items got the same unique value at the same moment (very rare)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That already exists. Please try again.' })
  }
  // Errors we created ourselves with a status and a friendly message
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message })
  }

  console.error(err)
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' })
}
