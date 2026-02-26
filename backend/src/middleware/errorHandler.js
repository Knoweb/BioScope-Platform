export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

export const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
}
