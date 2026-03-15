'use strict';

const { User, Profile } = require('../models');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');

const AppError = (message, code) => Object.assign(new Error(message), { statusCode: code });

const register = async ({ username, email, password, termsAccepted }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
  if (existing) {
    const field = existing.email === email ? 'Email' : 'Username';
    throw AppError(`${field} already in use`, 409);
  }

  const user    = await User.create({ username, email, password, termsAccepted });
  const profile = await Profile.create({ userId: user._id });
  await User.findByIdAndUpdate(user._id, { profileId: profile._id });

  const payload       = { _id: user._id.toString(), username };
  const accessToken   = signAccessToken(payload);
  const refreshToken  = signRefreshToken(payload);

  await User.findByIdAndUpdate(user._id, { refreshToken });

  return {
    user:  { _id: user._id, username, email },
    accessToken,
    refreshToken,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password').lean();
  if (!user) throw AppError('Invalid credentials', 401);

  // comparePassword needs a hydrated doc — re-fetch
  const userDoc = await User.findById(user._id).select('+password');
  const valid   = await userDoc.comparePassword(password);
  if (!valid) throw AppError('Invalid credentials', 401);
  if (!userDoc.isActive) throw AppError('Account is deactivated', 401);

  const payload       = { _id: user._id.toString(), username: user.username };
  const accessToken   = signAccessToken(payload);
  const refreshToken  = signRefreshToken(payload);

  await User.findByIdAndUpdate(user._id, { refreshToken });

  return {
    user: { _id: user._id, username: user.username, email: user.email },
    accessToken,
    refreshToken,
  };
};

const refreshTokens = async ({ refreshToken }) => {
  let payload;
  try { payload = verifyRefreshToken(refreshToken); }
  catch { throw AppError('Invalid or expired refresh token', 401); }

  const user = await User.findById(payload._id).select('+refreshToken').lean();
  if (!user || user.refreshToken !== refreshToken) {
    throw AppError('Refresh token reuse detected', 401);
  }

  const newAccessToken  = signAccessToken({ _id: user._id.toString(), username: user.username });
  const newRefreshToken = signRefreshToken({ _id: user._id.toString(), username: user.username });

  await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId).select('+refreshToken').lean();
  if (user && user.refreshToken === refreshToken) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken').lean();
  if (!user) throw AppError('User not found', 404);
  return user;
};

module.exports = { register, login, refreshTokens, logout, getMe };
