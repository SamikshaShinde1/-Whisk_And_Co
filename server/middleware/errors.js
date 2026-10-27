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

  console.error(err)
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' })
}
