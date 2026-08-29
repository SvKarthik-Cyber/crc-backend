const express = require('express');
const router = express.Router();
const authLimiter = require('../middleware/rateLimiter');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, registerOrgSchema, registerVolunteerSchema, registerIndividualSchema, loginSchema, changePasswordSchema, refreshTokenSchema } = require('../middleware/validate');
const {
  registerOrganization,
  registerVolunteer,
  registerIndividual,
  login,
  refreshToken,
  forwardToAdvisory,
  approvePoliceVerification,
  forceChangePassword,
} = require('../controllers/auth.controller');

// Public Registration Routes (Protected by Rate Limiter + Zod Validation)
router.post('/register/organization', authLimiter, validate(registerOrgSchema), registerOrganization);
router.post('/register/volunteer', authLimiter, validate(registerVolunteerSchema), registerVolunteer);
router.post('/register/individual', authLimiter, validate(registerIndividualSchema), registerIndividual);

// Public Login Route (Protected by Rate Limiter + Zod Validation)
router.post('/login', authLimiter, validate(loginSchema), login);

// Public Refresh Route - exchanges a refresh token for a new access token.
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

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
router.post('/change-password', authenticateToken, validate(changePasswordSchema), forceChangePassword);

module.exports = router;
