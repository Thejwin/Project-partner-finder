'use strict';

const { Profile } = require('../models');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const PRIVATE_FIELDS = '-offlineProfile -performanceAnalytics -aggregateSkillVector';

const getMyProfile = async (userId) => {
  const profile = await Profile.findOne({ userId })
    .select('-aggregateSkillVector')
    .populate('previousProjects', 'title status')
    .populate('popularProjects', 'title status')
    .lean();
  if (!profile) throw AppError('Profile not found', 404);
  return profile;
};

const updateProfile = async (userId, data) => {
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, runValidators: true }
  ).select(PRIVATE_FIELDS);
  if (!profile) throw AppError('Profile not found', 404);
  return profile;
};

/**
 * Replace skills array.
 * Each skill.name is stored as-is; the SkillVector resolution
 * is handled by the AI matching service asynchronously.
 * aggregateSkillVector is cleared by the pre-save hook in the model.
 */
const updateSkills = async (userId, skills) => {
  // Provide a placeholder skillVectorId (null) — the matching
  // service will backfill once it resolves the canonical vector.
  const skillEntries = skills.map((s) => ({
    name: s.name,
    level: s.level,
    skillVectorId: null,       // Resolved async by matching service
  }));

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: { skills: skillEntries } },
    { new: true, runValidators: false } // runValidators skipped: skillVectorId is conditionally null
  ).select('skills skillVectorUpdatedAt');

  if (!profile) throw AppError('Profile not found', 404);
  return profile;
};

const updateOfflineProfile = async (userId, data) => {
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: { offlineProfile: data } },
    { new: true }
  ).select('offlineProfile');
  if (!profile) throw AppError('Profile not found', 404);
  return { message: 'Offline profile updated' };
};

const updateProfilePicture = async (userId, url) => {
  await Profile.findOneAndUpdate({ userId }, { profilePicture: url });
  return { profilePicture: url };
};

module.exports = {
  getMyProfile,
  updateProfile,
  updateSkills,
  updateOfflineProfile,
  updateProfilePicture,
};
