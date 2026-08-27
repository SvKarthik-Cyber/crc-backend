const express = require('express');
const router = express.Router();
const authLimiter = require('../middleware/rateLimiter');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  registerOrganization,
  registerVolunteer,
  registerIndividual,
  login,
  forwardToAdvisory,
  approvePoliceVerification,
  forceChangePassword,
} = require('../controllers/auth.controller');

// Public Registration Routes (Protected by Rate Limiter)
router.post('/register/organization', authLimiter, registerOrganization);
router.post('/register/volunteer', authLimiter, registerVolunteer);
router.post('/register/individual', authLimiter, registerIndividual);

// Public Login Route (Protected by Rate Limiter)
router.post('/login', authLimiter, login);

// Admin & Advisory Review Pipeline Routes
router.post(
  '/forward-advisory',
  authenticateToken,
  authorizeRoles('admin', 'advisory'),
  forwardToAdvisory
);

router.post(
  '/approve-police',
  authenticateToken,
  authorizeRoles('admin', 'police'),
  approvePoliceVerification
);

// Authenticated Password Change (Required for Temporary OTP users)
router.post('/change-password', authenticateToken, forceChangePassword);

module.exports = router;