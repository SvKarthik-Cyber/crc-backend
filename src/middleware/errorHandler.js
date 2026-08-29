// Centralized error handling.
//
// asyncHandler wraps an async controller so any thrown/rejected error is
// forwarded to Express's error pipeline via next(error) instead of crashing
// the process or requiring every controller to repeat try/catch.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler - runs when no route matched at all.
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Final error handler - runs when any middleware/controller calls next(error),
// or when asyncHandler catches a rejected promise, or when a synchronous
// throw happens inside a non-async handler.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Multer file upload errors (wrong type, too large, etc.)
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  if (err && /Invalid file type/i.test(err.message || '')) {
    return res.status(400).json({ message: err.message });
  }

  // Zod validation errors bubbled up from the `validate` middleware
  if (err && err.name === 'ZodError') {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.issues || err.errors,
    });
  }

  // Mongoose validation errors
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose duplicate key errors
  if (err && err.code === 11000) {
    return res.status(409).json({
      message: 'A record with that value already exists.',
      field: Object.keys(err.keyValue || {})[0],
    });
  }

  // Malformed JSON body
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON in request body.' });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = { asyncHandler, notFound, errorHandler };
