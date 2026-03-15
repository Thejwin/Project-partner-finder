'use strict';

const authService  = require('../services/auth.service');
const { success, created } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  created(res, result);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  success(res, result);
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshTokens(req.body);
  success(res, result);
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, req.body.refreshToken);
  success(res, { message: 'Logged out' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  success(res, { user });
});
