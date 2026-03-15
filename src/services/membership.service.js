'use strict';

const { Project, Notification } = require('../models');
const { getIO, ROOMS, EVENTS }  = require('../config/socket');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

/** Safely emit without crashing when io is not ready (tests) */
const emit = (room, event, payload) => {
  try { getIO().to(room).emit(event, payload); } catch (_) {}
};

const applyToProject = async (projectId, userId) => {
  const project = await Project.findById(projectId).select('ownerId collaborators proposalList visibility').lean();
  if (!project) throw AppError('Project not found', 404);
  if (project.ownerId.toString() === userId) throw AppError('Owner cannot apply to own project', 422);
  if (project.collaborators.some((id) => id.toString() === userId)) {
    throw AppError('Already a collaborator', 422);
  }
  if (project.proposalList.some((p) => p.userId.toString() === userId)) {
    throw AppError('Application already submitted', 409);
  }

  await Project.findByIdAndUpdate(projectId, {
    $push: { proposalList: { userId, status: 'pending', appliedAt: new Date() } },
  });

  // Notify the owner
  await Notification.create({
    userId: project.ownerId,
    type: 'project_invite',
    referenceId: projectId,
    referenceModel: 'Project',
    message: `A user applied to join your project.`,
  });

  try {
    getIO().to(`user:${project.ownerId}`).emit('notification:new', { type: 'project_invite' });
  } catch (_) { /* socket not yet ready in tests */ }

  return { message: 'Application submitted' };
};

const getProposals = async (projectId) => {
  const project = await Project.findById(projectId)
    .select('proposalList')
    .populate('proposalList.userId', 'username')
    .lean();
  if (!project) throw AppError('Project not found', 404);
  return { proposals: project.proposalList };
};

const acceptProposal = async (projectId, applicantId) => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, 'proposalList.userId': applicantId },
    {
      $set: { 'proposalList.$.status': 'accepted' },
      $addToSet: { collaborators: applicantId },
    },
    { new: true }
  ).select('collaborators proposalList');

  if (!project) throw AppError('Proposal or project not found', 404);

  await Notification.create({
    userId: applicantId,
    type: 'project_invite',
    referenceId: projectId,
    referenceModel: 'Project',
    message: 'Your project application was accepted!',
  });

  /* ── Real-time: notify accepted user directly ───────────────────────────── */
  emit(ROOMS.user(applicantId), EVENTS.NOTIF_NEW, { type: 'project_invite', projectId });

  /* ── Real-time: broadcast new member to the project room ────────────────── */
  emit(ROOMS.project(projectId.toString()), EVENTS.MEMBER_JOINED, {
    userId: applicantId,
    projectId,
  });

  return project;
};

const rejectProposal = async (projectId, applicantId) => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, 'proposalList.userId': applicantId },
    { $set: { 'proposalList.$.status': 'rejected' } },
    { new: true }
  ).select('proposalList');

  if (!project) throw AppError('Proposal or project not found', 404);
  return project;
};

const removeCollaborator = async (projectId, collaboratorId) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $pull: { collaborators: collaboratorId } },
    { new: true }
  ).select('collaborators');
  if (!project) throw AppError('Project not found', 404);

  /* ── Real-time: notify removed user and broadcast to project room ─────── */
  emit(ROOMS.user(collaboratorId), EVENTS.NOTIF_NEW, {
    type: 'system',
    message: 'You have been removed from a project.',
  });
  emit(ROOMS.project(projectId.toString()), EVENTS.MEMBER_LEFT, {
    userId: collaboratorId,
    projectId,
  });

  return project;
};

const inviteUser = async (projectId, targetUserId) => {
  const project = await Project.findById(projectId).select('proposalList collaborators ownerId').lean();
  if (!project) throw AppError('Project not found', 404);
  if (project.ownerId.toString() === targetUserId) throw AppError('Cannot invite the owner', 422);

  await Notification.create({
    userId: targetUserId,
    type: 'project_invite',
    referenceId: projectId,
    referenceModel: 'Project',
    message: 'You have been invited to join a project.',
  });

  /* ── Real-time: notify invited user ────────────────────────────────────── */
  emit(ROOMS.user(targetUserId), EVENTS.NOTIF_NEW, {
    type: 'project_invite',
    projectId,
    message: 'You have been invited to join a project.',
  });

  return { message: 'Invitation sent' };
};

const addCollaborator = async (projectId, userId) => {
  const project = await Project.findById(projectId).select('ownerId collaborators proposalList').lean();
  if (!project) throw AppError('Project not found', 404);

  if (project.ownerId.toString() === userId) {
    throw AppError('Owner is already a member', 422);
  }

  if (project.collaborators.some((id) => id.toString() === userId)) {
    throw AppError('User is already a collaborator', 422);
  }

  await Project.findByIdAndUpdate(projectId, {
    $addToSet: { collaborators: userId },
    $set: { 
      'proposalList.$[elem].status': 'accepted' 
    }
  }, {
    arrayFilters: [{ 'elem.userId': userId }]
  });

  // Notify the user
  await Notification.create({
    userId,
    type: 'project_invite',
    referenceId: projectId,
    referenceModel: 'Project',
    message: 'You have been added to a project!',
  });

  /* ── Real-time notifications ───────────────────────────────────────────── */
  emit(ROOMS.user(userId), EVENTS.NOTIF_NEW, { type: 'project_invite', projectId });
  emit(ROOMS.project(projectId.toString()), EVENTS.MEMBER_JOINED, {
    userId,
    projectId,
  });

  return { message: 'Collaborator added' };
};

module.exports = {
  applyToProject,
  getProposals,
  acceptProposal,
  rejectProposal,
  removeCollaborator,
  inviteUser,
  addCollaborator,
};
