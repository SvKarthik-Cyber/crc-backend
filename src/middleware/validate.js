const { z } = require('zod');

// These schemas are the single source of truth for what the auth controllers
// accept. Frontend registration/login forms must send payloads shaped exactly
// like this (see the "Field name mismatch" section of the integration audit).

const registerOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Enter a valid email address.'),
  mobile: z.string().min(10, 'Enter a valid mobile number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  district: z.string().min(2, 'District is required.'),
  orgProfile: z.object({
    orgType: z.string().min(1, 'Organization type is required.'),
    sector: z.string().min(1, 'Sector is required.'),
    contactPerson: z.string().min(1, 'Contact person is required.'),
    designation: z.string().min(1, 'Designation is required.'),
    address: z.string().min(1, 'Address is required.'),
  }),
});

const registerVolunteerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Enter a valid email address.'),
  mobile: z.string().min(10, 'Enter a valid mobile number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  district: z.string().min(2, 'District is required.'),
  volunteerProfile: z.object({
    occupation: z.string().min(1, 'Occupation is required.'),
    skills: z.array(z.string()).default([]),
    certifications: z.array(z.string()).optional().default([]),
    availability: z.string().min(1, 'Availability is required.'),
  }),
});

const registerIndividualSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Enter a valid email address.'),
  mobile: z.string().min(10, 'Enter a valid mobile number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  district: z.string().min(2, 'District is required.'),
  individualProfile: z
    .object({
      occupation: z.string().min(1, 'Occupation is required.'),
      cvUrl: z.string().optional(),
    })
    .default({}),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required.'),
});

// Express middleware factory: validates + replaces req.body with the parsed
// (and defaulted/coerced) value, or forwards a ZodError to the centralized
// error handler.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      details: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = {
  validate,
  registerOrgSchema,
  registerVolunteerSchema,
  registerIndividualSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
};
