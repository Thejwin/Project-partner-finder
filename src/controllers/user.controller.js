'use strict';

const userService    = require('../services/user.service');
const profileService = require('../services/profile.service');
const { success }    = require('../utils/apiResponse');
const asyncHandler   = require('../utils/asyncHandler');

// ── User endpoints ────────────────────────────────────────────────────────────
exports.searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(req.query);
  success(res, result);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const profile = await userService.getUserById(req.params.userId, req.user._id);
  success(res, { profile });
});

// ── Profile endpoints ─────────────────────────────────────────────────────────
exports.getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getMyProfile(req.user._id);
  success(res, { profile });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(req.user._id, req.body);
  success(res, { profile });
});

exports.updateSkills = asyncHandler(async (req, res) => {
  const result = await profileService.updateSkills(req.user._id, req.body.skills);
  success(res, result);
});

exports.updateProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file?.cloudinaryUrl) {
    const { error } = require('../utils/apiResponse');
    return error(res, 'File upload failed', 400);
  }
  const result = await profileService.updateProfilePicture(req.user._id, req.file.cloudinaryUrl);
  success(res, result);
});

exports.updateOfflineProfile = asyncHandler(async (req, res) => {
  const result = await profileService.updateOfflineProfile(req.user._id, req.body);
  success(res, result);
});
