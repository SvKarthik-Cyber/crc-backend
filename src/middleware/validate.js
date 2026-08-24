const { z } = require('zod');

const registerOrgSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10),
  password: z.string().min(8),
  district: z.string().min(2),
  orgProfile: z.object({
    orgType: z.string(),
    sector: z.string(),
    contactPerson: z.string(),
    designation: z.string(),
    address: z.string(),
  }),
});

const registerVolunteerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10),
  password: z.string().min(8),
  district: z.string().min(2),
  volunteerProfile: z.object({
    occupation: z.string(),
    skills: z.array(z.string()),
    certifications: z.array(z.string()).optional(),
    availability: z.string(),
  }),
});

const registerIndividualSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10),
  password: z.string().min(8),
  district: z.string().min(2),
  individualProfile: z.object({
    occupation: z.string(),
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
};

module.exports = {
  validate,
  registerOrgSchema,
  registerVolunteerSchema,
  registerIndividualSchema,
  loginSchema,
};