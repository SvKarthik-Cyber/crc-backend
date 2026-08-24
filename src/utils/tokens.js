const jwt = require('jsonwebtoken');
const { jwtAccessSecret, jwtRefreshSecret } = require('../config/env');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, jwtAccessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

module.exports = { generateTokens };