'use strict';

const projectService    = require('../services/project.service');
const membershipService = require('../services/membership.service');
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
