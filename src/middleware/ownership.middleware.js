'use strict';

const { Project } = require('../models');
const { error }   = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * requireProjectOwner
 * Confirms req.user._id === project.ownerId.
 * Must be used AFTER protect and a route that provides :projectId.
 */
const requireProjectOwner = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId).select('ownerId').lean();
  if (!project) return error(res, 'Project not found', 404);
  if (project.ownerId.toString() !== req.user._id) {
    return error(res, 'Only the project owner can perform this action', 403);
  }
  req.project = project;
  return next();
});

/**
 * requireProjectMember
 * Confirms req.user is the owner OR an accepted collaborator.
 */
const requireProjectMember = asyncHandler(async (req, res, next) => {
  const project = await Project
    .findById(req.params.projectId)
    .select('ownerId collaborators')
    .lean();

  if (!project) return error(res, 'Project not found', 404);

  const userId = req.user._id;
  const isOwner = project.ownerId.toString() === userId;
  const isCollaborator = project.collaborators.some(
    (id) => id.toString() === userId
  );

  if (!isOwner && !isCollaborator) {
    return error(res, 'Access restricted to project members', 403);
  }

  req.project = project;
  req.isProjectOwner = isOwner;
  return next();
});

module.exports = { requireProjectOwner, requireProjectMember };
