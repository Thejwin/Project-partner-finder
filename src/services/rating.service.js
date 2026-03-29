'use strict';

const { Rating, Project, Profile, Notification } = require('../models');
const { getIO, ROOMS, EVENTS } = require('../config/socket');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

/** Safely emit without crashing when io is not ready */
const emit = (room, event, payload) => {
  try { getIO().to(room).emit(event, payload); } catch (_) {}
};

/**
 * Submit a rating for a fellow project member.
 * Updates the ratee's reputation score as a running average.
 */
const submitRating = async (projectId, raterId, rateeId, score, comment) => {
  // ── Guards ──────────────────────────────────────────────────────────────────
  if (raterId === rateeId) throw AppError('Cannot rate yourself', 422);

  const project = await Project.findById(projectId)
    .select('ownerId collaborators status')
    .lean();

  if (!project) throw AppError('Project not found', 404);
  if (project.status !== 'completed') {
    throw AppError('Ratings can only be submitted for completed projects', 422);
  }

  // Verify the rater is a member (owner or collaborator)
  const allMembers = [
    project.ownerId.toString(),
    ...project.collaborators.map((id) => id.toString()),
  ];

  if (!allMembers.includes(raterId)) {
    throw AppError('Only project members can submit ratings', 403);
  }
  if (!allMembers.includes(rateeId)) {
    throw AppError('Ratee is not a member of this project', 422);
  }

  // ── Create rating (unique index prevents duplicates) ──────────────────────
  let rating;
  try {
    rating = await Rating.create({ projectId, raterId, rateeId, score, comment });
  } catch (err) {
    if (err.code === 11000) {
      throw AppError('You have already rated this member for this project', 409);
    }
    throw err;
  }

  // ── Recompute reputation as running average of ALL ratings received ────────
  const agg = await Rating.aggregate([
    { $match: { rateeId: project.collaborators.find((id) => id.toString() === rateeId) || project.ownerId } },
    { $group: { _id: null, avg: { $avg: '$score' } } },
  ]);

  // Fallback: compute via a simpler query
  const allRatings = await Rating.find({ rateeId }).select('score').lean();
  const avgScore = allRatings.length
    ? allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length
    : 0;

  // Round to 1 decimal place
  const reputationScore = Math.round(avgScore * 10) / 10;

  await Profile.findOneAndUpdate(
    { userId: rateeId },
    { $set: { 'performanceAnalytics.reputationScore': reputationScore } }
  );

  // ── Notify the ratee ──────────────────────────────────────────────────────
  await Notification.create({
    userId: rateeId,
    type: 'system',
    referenceId: projectId,
    referenceModel: 'Project',
    message: `You received a ${score}-star rating from a collaborator.`,
  });

  emit(ROOMS.user(rateeId), EVENTS.NOTIF_NEW, { type: 'system' });

  return rating;
};

/**
 * Get rating info for a project — who the current user has already rated,
 * and all project members (so the UI knows who is eligible).
 */
const getRatings = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .select('ownerId collaborators status')
    .populate('ownerId', 'username')
    .populate('collaborators', 'username')
    .lean();

  if (!project) throw AppError('Project not found', 404);

  // All members (owner + collaborators)
  const allMembers = [
    { _id: project.ownerId._id, username: project.ownerId.username, role: 'owner' },
    ...project.collaborators.map((c) => ({
      _id: c._id,
      username: c.username,
      role: 'collaborator',
    })),
  ];

  // Ratings the current user has already submitted for this project
  const myRatings = await Rating.find({ projectId, raterId: userId })
    .select('rateeId score comment')
    .lean();

  const ratedUserIds = new Set(myRatings.map((r) => r.rateeId.toString()));

  const members = allMembers
    .filter((m) => m._id.toString() !== userId) // exclude self
    .map((m) => ({
      ...m,
      alreadyRated: ratedUserIds.has(m._id.toString()),
      myRating: myRatings.find((r) => r.rateeId.toString() === m._id.toString()) || null,
    }));

  return { members, projectStatus: project.status };
};

module.exports = {
  submitRating,
  getRatings,
};
