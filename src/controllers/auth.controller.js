const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateTokens } = require('../utils/tokens');

// Helper to register user
const registerUser = async (req, res, role, profileKey) => {
  try {
    const { email, password, name, mobile, district, [profileKey]: profileData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Set status: individuals require advisory review; others default to ACTIVE
    const verificationStatus = (role === 'individual') ? 'PENDING_ADVISORY' : 'ACTIVE';
    const isVerified = role !== 'individual';

    const newUser = await User.create({
      role,
      name,
      email,
      mobile,
      district,
      passwordHash,
      verificationStatus,
      isVerified,
      mustChangePassword: false,
      [profileKey]: profileData,
    });

    // If pending background check, return confirmation without full login tokens
    if (role === 'individual') {
      return res.status(201).json({
        message: 'Registration submitted successfully. Account pending advisory review.',
        verificationStatus: newUser.verificationStatus,
      });
    }

    const tokens = generateTokens({ 
      id: newUser._id, 
      role: newUser.role, 
      mustChangePassword: newUser.mustChangePassword 
    });

    res.status(201).json({
      message: `${role} registered successfully`,
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        verificationStatus: newUser.verificationStatus 
      },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.registerOrganization = (req, res) => registerUser(req, res, 'organization', 'orgProfile');
exports.registerVolunteer = (req, res) => registerUser(req, res, 'volunteer', 'volunteerProfile');
exports.registerIndividual = (req, res) => registerUser(req, res, 'individual', 'individualProfile');

// Login Handler
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Block access for unapproved states
    if (['PENDING_ADVISORY', 'PENDING_POLICE_VERIFICATION'].includes(user.verificationStatus)) {
      return res.status(403).json({ 
        message: 'Account pending background verification. You cannot log in yet.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens({ 
      id: user._id, 
      role: user.role, 
      mustChangePassword: user.mustChangePassword 
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
        verificationStatus: user.verificationStatus
      },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// 1. Admin/Advisory Step: Forward profile to Police
exports.forwardToAdvisory = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user || user.verificationStatus !== 'PENDING_ADVISORY') {
      return res.status(400).json({ message: 'User is not pending advisory review.' });
    }

    user.verificationStatus = 'PENDING_POLICE_VERIFICATION';
    await user.save();

    res.status(200).json({ message: 'Profile successfully forwarded to police verification.' });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed', error: error.message });
  }
};

// 2. Police Step: Pass verification & issue OTP / Temp Password
exports.approvePoliceVerification = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user || user.verificationStatus !== 'PENDING_POLICE_VERIFICATION') {
      return res.status(400).json({ message: 'User is not pending police verification.' });
    }

    // Generate random 12-char OTP temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(tempPassword, salt);

    user.verificationStatus = 'APPROVED_TEMPORARY';
    user.mustChangePassword = true;

    await user.save();

    res.status(200).json({
      message: 'Police verification approved. OTP issued.',
      temporaryPassword: tempPassword // Transmitted securely to user via email/SMS in production
    });
  } catch (error) {
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
};

// 3. Mandatory First-Login Password Change
exports.forceChangePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id; // Extracted from decoded JWT auth middleware

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

    res.status(200).json({ message: 'Password updated successfully. Account is now active.' });
  } catch (error) {
    res.status(500).json({ message: 'Password change failed', error: error.message });
  }
};