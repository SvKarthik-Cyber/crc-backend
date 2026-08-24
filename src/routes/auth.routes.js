const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {
  validate,
  registerOrgSchema,
  registerVolunteerSchema,
  registerIndividualSchema,
  loginSchema,
} = require('../middleware/validate');

router.post('/register/organization', validate(registerOrgSchema), authController.registerOrganization);
router.post('/register/volunteer', validate(registerVolunteerSchema), authController.registerVolunteer);
router.post('/register/individual', validate(registerIndividualSchema), authController.registerIndividual);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;