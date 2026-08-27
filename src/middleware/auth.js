const jwt = require('jsonwebtoken');
const { jwtAccessSecret } = require('../config/env');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, jwtAccessSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;

    // Guard: Block API access if user must change their temporary password first
    const isChangePasswordRoute = req.path.includes('/change-password');
    if (req.user.mustChangePassword && !isChangePasswordRoute) {
      return res.status(403).json({
        message: 'Access denied. You must update your temporary password before proceeding.',
        mustChangePassword: true,
      });
    }

    next();
  });
};

// Role-based access control middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};