require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters long'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  // Used to email applicants their temporary OTP password once staff approve
  // them (see approvePoliceVerification + utils/mailer.js). Get a free key
  // at resend.com. RESEND_FROM_EMAIL must be an address on a domain you've
  // verified with Resend, OR the sandbox address 'onboarding@resend.dev'
  // (only delivers to your own Resend account email until you verify a domain).
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().default('onboarding@resend.dev'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment Variable Configuration Error:', parsed.error.format());
  process.exit(1);
}

module.exports = {
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGO_URI,
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  clientOrigin: parsed.data.CLIENT_ORIGIN,
  resendApiKey: parsed.data.RESEND_API_KEY,
  resendFromEmail: parsed.data.RESEND_FROM_EMAIL,
};