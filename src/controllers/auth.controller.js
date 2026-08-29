const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/tokens');
const { sendApprovalEmail } = require('../utils/mailer');
const { asyncHandler } = require('../middleware/errorHandler');

const registerUser = async (req, res, role, profileKey) => {
  const { email, password, name, mobile, district, [profileKey]: profileData } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Every account type (organization, volunteer, individual) now waits for
  // staff review - advisory, then police verification - before it can log
  // in. See forwardToAdvisory and approvePoliceVerification below.
  const newUser = await User.create({
    role,
    name,
    email,
    mobile,
    district,
    passwordHash,
    verificationStatus: 'PENDING_ADVISORY',
    isVerified: false,
    mustChangePassword: false,
    [profileKey]: profileData,
  });

  return res.status(201).json({
    message: 'Registration submitted successfully. Your account is pending advisory review. You will receive an email with login instructions once approved.',
    verificationStatus: newUser.verificationStatus,
  });
};

exports.registerOrganization = asyncHandler((req, res) => registerUser(req, res, 'organization', 'orgProfile'));
exports.registerVolunteer = asyncHandler((req, res) => registerUser(req, res, 'volunteer', 'volunteerProfile'));
exports.registerIndividual = asyncHandler((req, res) => registerUser(req, res, 'individual', 'individualProfile'));

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (['PENDING_ADVISORY', 'PENDING_POLICE_VERIFICATION'].includes(user.verificationStatus)) {
    return res.status(403).json({
      message: 'Account pending background verification. You cannot log in yet.',
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const tokens = generateTokens({
    id: user._id,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  });

  res.status(200).json({
    message: user.mustChangePassword
      ? 'Login successful. Temporary OTP password used. Please update your password.'
      : 'Login successful',
    mustChangePassword: user.mustChangePassword,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      district: user.district,
      verificationStatus: user.verificationStatus,
    },
    ...tokens,
  });
});

// POST /api/v1/auth/refresh
// Exchanges a still-valid refresh token for a fresh access/refresh pair,
// without requiring the user to log in again every 15 minutes.
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }

  // Re-check the user still exists / isn't blocked, rather than trusting
  // the token payload blindly for another 7 days.
  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: 'Account no longer exists.' });
  }

  const tokens = generateTokens({
    id: user._id,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  });

  res.status(200).json({ message: 'Token refreshed', ...tokens });
});

exports.forwardToAdvisory = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user || user.verificationStatus !== 'PENDING_ADVISORY') {
    return res.status(400).json({ message: 'User is not pending advisory review.' });
  }

  user.verificationStatus = 'PENDING_POLICE_VERIFICATION';
  await user.save();

  res.status(200).json({ message: 'Profile successfully forwarded to police verification.' });
});

exports.approvePoliceVerification = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user || user.verificationStatus !== 'PENDING_POLICE_VERIFICATION') {
    return res.status(400).json({ message: 'User is not pending police verification.' });
  }

  const tempPassword = crypto.randomBytes(6).toString('hex');
  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(tempPassword, salt);

  user.verificationStatus = 'APPROVED_TEMPORARY';
  user.mustChangePassword = true;

  await user.save();

  const emailResult = await sendApprovalEmail({
    to: user.email,
    name: user.name,
    temporaryPassword: tempPassword,
  });

  res.status(200).json({
    message: emailResult.sent
      ? 'Police verification approved. OTP emailed to the applicant.'
      : 'Police verification approved, but the approval email failed to send. Share the temporary password with the applicant directly.',
    emailSent: emailResult.sent,
    // Kept in the response even when email succeeds, so staff always have a
    // manual fallback (e.g. the applicant's inbox is unreachable).
    temporaryPassword: tempPassword,
  });
});

exports.forceChangePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user || !user.mustChangePassword) {
    return res.status(400).json({ message: 'Password change is not required for this account.' });
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.mustChangePassword = false;
  user.isVerified = true;
  user.verificationStatus = 'ACTIVE';

  await user.save();

  // The old access token has mustChangePassword: true baked into its
  // payload (see authenticateToken in middleware/auth.js) - without a fresh
  // pair here, every other route stays blocked until that token naturally
  // expires. Issuing new tokens lets the frontend proceed immediately.
  const tokens = generateTokens({
    id: user._id,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  });

  res.status(200).json({
    message: 'Password updated successfully. Account is now active.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      district: user.district,
      verificationStatus: user.verificationStatus,
    },
    ...tokens,
  });
});