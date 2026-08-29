const jwt = require('jsonwebtoken');
const { jwtAccessSecret, jwtRefreshSecret } = require('../config/env');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, jwtAccessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Verifies a refresh token and returns its decoded payload, or throws.
const verifyRefreshToken = (token) => jwt.verify(token, jwtRefreshSecret);

module.exports = { generateTokens, verifyRefreshToken };
