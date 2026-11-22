const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user, expiresIn) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    },
    env.JWT.ACCESS_SECRET,
    { expiresIn: expiresIn || env.JWT.ACCESS_EXPIRY }
  );
};

const generateRefreshToken = (user, expiresIn, rememberMe = false) => {
  return jwt.sign(
    {
      id: user._id,
      version: user.password ? user.password.slice(-10) : '',
      rememberMe: Boolean(rememberMe)
    },
    env.JWT.REFRESH_SECRET,
    { expiresIn: expiresIn || env.JWT.REFRESH_EXPIRY }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT.ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT.REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
