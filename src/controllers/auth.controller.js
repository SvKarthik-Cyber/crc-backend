const bcrypt = require('bcryptjs');
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

    const newUser = await User.create({
      role,
      name,
      email,
      mobile,
      district,
      passwordHash,
      [profileKey]: profileData,
    });

    const tokens = generateTokens({ id: newUser._id, role: newUser.role });

    res.status(201).json({
      message: `${role} registered successfully`,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.registerOrganization = (req, res) => registerUser(req, res, 'organization', 'orgProfile');
exports.registerVolunteer = (req, res) => registerUser(req, res, 'volunteer', 'volunteerProfile');
exports.registerIndividual = (req, res) => registerUser(req, res, 'individual', 'individualProfile');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens({ id: user._id, role: user.role });

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, district: user.district },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};