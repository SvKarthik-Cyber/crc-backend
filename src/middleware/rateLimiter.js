const rateLimit = require('express-rate-limit');

// Rate limiter to prevent brute-force attacks on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    message: 'Too many login or registration attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = authLimiter;