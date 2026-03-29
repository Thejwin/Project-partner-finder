'use strict';

const { User, Profile } = require('../models');
const paginate = require('../utils/paginate');

const AppError = (message, code) => Object.assign(new Error(message), { statusCode: code });

const PROFILE_PUBLIC_SELECT = 'name header profilePicture skills areasOfInterest location';

const searchUsers = async (query) => {
  const { q, page: p, limit: l } = query;
  const { skip, limit, buildMeta } = paginate({ page: p, limit: l });

  const filter = q
    ? { $text: { $search: q }, profileVisibility: 'public' }
    : { profileVisibility: 'public' };

  const [total, profiles] = await Promise.all([
    Profile.countDocuments(filter),
    Profile.find(filter)
      .select(PROFILE_PUBLIC_SELECT)
      .populate('userId', 'username')
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { users: profiles, pagination: buildMeta(total) };
};

const getUserById = async (userId, requesterId) => {
  const profile = await Profile.findOne({ userId })
    .select(`${PROFILE_PUBLIC_SELECT} areasOfInterest education experience links previousProjects popularProjects performanceAnalytics profileVisibility`)
    .populate('userId', 'username')
    .populate('previousProjects', 'title status type')
    .populate('popularProjects', 'title status type')
    .lean();

  if (!profile) throw AppError('User not found', 404);

  // Only the owner can see their own private profile
  if (profile.profileVisibility === 'private' && userId.toString() !== requesterId) {
    throw AppError('This profile is private', 403);
  }

  return profile;
};

module.exports = { searchUsers, getUserById };
