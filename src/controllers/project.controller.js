'use strict';

const projectService    = require('../services/project.service');
const membershipService = require('../services/membership.service');
const recommendationService = require('../services/recommendation.service');
const ratingService     = require('../services/rating.service');
const { logActivity, getActivitiesByProject } = require('../services/activity.service');
const { success, created } = require('../utils/apiResponse');
const asyncHandler       = require('../utils/asyncHandler');

// ── CRUD ──────────────────────────────────────────────────────────────────────
exports.createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  created(res, { project });
});

exports.getProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getProjects(req.query);
  success(res, result);
});

exports.searchProjects = asyncHandler(async (req, res) => {
  const result = await projectService.searchProjects(req.query);
  success(res, result);
});

exports.getMyProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getMyProjects(req.user._id, req.query);
  success(res, result);
});

exports.getCollaboratingProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getCollaboratingProjects(req.user._id, req.query);
  success(res, result);
});

exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId, req.user._id);
  success(res, { project });
});

exports.updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.projectId, req.body);
  
  await logActivity({
    projectId: req.params.projectId,
    userId: req.user._id,
    type: 'PROJECT_UPDATED',
    description: `Updated project settings`,
  });

  success(res, { project });
});

exports.deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject(req.params.projectId);
  success(res, result);
});

// ── Membership ────────────────────────────────────────────────────────────────
exports.applyToProject = asyncHandler(async (req, res) => {
  const result = await membershipService.applyToProject(req.params.projectId, req.user._id);
  success(res, result);
});

exports.getProposals = asyncHandler(async (req, res) => {
  const result = await membershipService.getProposals(req.params.projectId);
  success(res, result);
});

exports.acceptProposal = asyncHandler(async (req, res) => {
  const project = await membershipService.acceptProposal(
    req.params.projectId,
    req.params.userId
  );
  success(res, { project });
});

exports.rejectProposal = asyncHandler(async (req, res) => {
  const project = await membershipService.rejectProposal(
    req.params.projectId,
    req.params.userId
  );
  success(res, { project });
});

exports.removeCollaborator = asyncHandler(async (req, res) => {
  const project = await membershipService.removeCollaborator(
    req.params.projectId,
    req.params.userId
  );

  await logActivity({
    projectId: req.params.projectId,
    userId: req.user._id,
    type: 'MEMBER_REMOVED',
    description: `Removed a member from the project`,
  });

  success(res, { project });
});

exports.inviteUser = asyncHandler(async (req, res) => {
  const result = await membershipService.inviteUser(req.params.projectId, req.params.userId);
  success(res, result);
});

exports.addCollaborator = asyncHandler(async (req, res) => {
  const result = await membershipService.addCollaborator(req.params.projectId, req.params.userId);
  success(res, result);
});

exports.leaveProject = asyncHandler(async (req, res) => {
  const result = await membershipService.leaveProject(req.params.projectId, req.user._id);
  success(res, result);
});

exports.getRecommendedProjects = asyncHandler(async (req, res) => {
  const projects = await recommendationService.getRecommendedProjects(req.user._id);
  success(res, { projects });
});

exports.getRecommendedUsers = asyncHandler(async (req, res) => {
  const users = await recommendationService.getRecommendedUsers(req.params.projectId);
  success(res, { users });
});

// ── Finish project ────────────────────────────────────────────────────────────
exports.finishProject = asyncHandler(async (req, res) => {
  const result = await projectService.finishProject(req.params.projectId, req.user._id);
  
  await logActivity({
    projectId: req.params.projectId,
    userId: req.user._id,
    type: 'PROJECT_FINISHED',
    description: `Marked project as completed!`,
  });

  success(res, result);
});

// ── Ratings ───────────────────────────────────────────────────────────────────
exports.submitRating = asyncHandler(async (req, res) => {
  const { rateeId, score, comment } = req.body;
  const rating = await ratingService.submitRating(
    req.params.projectId,
    req.user._id,
    rateeId,
    score,
    comment
  );
  created(res, { rating });
});

exports.getRatings = asyncHandler(async (req, res) => {
  const result = await ratingService.getRatings(req.params.projectId, req.user._id);
  success(res, result);
});

exports.getActivities = asyncHandler(async (req, res) => {
  const activities = await getActivitiesByProject(req.params.projectId, req.query);
  success(res, { activities });
});
