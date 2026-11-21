export function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }) }
export function errorHandler(error, req, res, next) {
  const status = error.statusCode || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500)
  if (status >= 500) console.error(error)
  const duplicateMessage = error.keyPattern?.email
    ? 'An account with this email already exists'
    : error.keyPattern?.storyKey
      ? 'Unable to issue a unique story ID. Please retry.'
      : error.keyPattern?.userId
        ? 'This user is already a project member'
        : 'A record with this value already exists'
  const message = error.code === 11000 ? duplicateMessage : error.message || 'Unexpected server error'
  res.status(status).json({ success: false, message, ...(error.details && { details: error.details }), ...(process.env.NODE_ENV === 'development' && { stack: error.stack }) })
}
