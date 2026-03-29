'use strict';

const { Project, Task } = require('../models');
const paginate = require('../utils/paginate');
const nlpService = require('./nlp.service');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

// ── Create ────────────────────────────────────────────────────────────────────
const createProject = async (ownerId, data) => {
  const project = await Project.create({ ...data, ownerId });
  
  if (data.requiredSkills && data.requiredSkills.length > 0) {
    const skillNames = data.requiredSkills.map((s) => s.name);
    nlpService.ensureSkillVectors(skillNames).catch(console.error);
  }

  return project;
};

// ── Browse public projects ────────────────────────────────────────────────────
const getProjects = async (query) => {
  const { status, type, tags, page: p, limit: l } = query;
  const { skip, limit, buildMeta } = paginate({ page: p, limit: l });

  const filter = { visibility: 'public' };
  if (status) filter.status = status;
  if (type)   filter.type   = type;
  if (tags)   filter.tags   = { $in: tags.split(',') };

  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .select('-aggregateRequiredVector -adminActions -proposalList')
      .populate('ownerId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { projects, pagination: buildMeta(total) };
};

// ── Full-text search ──────────────────────────────────────────────────────────
const searchProjects = async (query) => {
  const { q, page: p, limit: l } = query;
  const { skip, limit, buildMeta } = paginate({ page: p, limit: l });

  const filter = { visibility: 'public', ...(q && { $text: { $search: q } }) };
  const projection = q ? { score: { $meta: 'textScore' } } : {};

  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter, projection)
      .select('-aggregateRequiredVector -adminActions')
      .populate('ownerId', 'username')
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { projects, pagination: buildMeta(total) };
};

// ── My projects ───────────────────────────────────────────────────────────────
const getMyProjects = async (userId, query) => {
  const { status, page: p, limit: l } = query;
  const { skip, limit, buildMeta } = paginate({ page: p, limit: l });

  const filter = { ownerId: userId };
  if (status) filter.status = status;

  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .select('-aggregateRequiredVector')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { projects, pagination: buildMeta(total) };
};

// ── Projects where user is a collaborator ─────────────────────────────────────
const getCollaboratingProjects = async (userId, query) => {
  const { page: p, limit: l } = query;
  const { skip, limit, buildMeta } = paginate({ page: p, limit: l });

  const filter = { collaborators: userId };
  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .select('-aggregateRequiredVector -adminActions')
      .populate('ownerId', 'username')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { projects, pagination: buildMeta(total) };
};

// ── Get single ────────────────────────────────────────────────────────────────
const getProjectById = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .select('-aggregateRequiredVector')
    .populate('ownerId', 'username')
    .populate('collaborators', 'username')
    .lean();

  if (!project) throw AppError('Project not found', 404);

  if (project.visibility === 'private') {
    const isMember =
      project.ownerId._id.toString() === userId ||
      project.collaborators.some((c) => c._id.toString() === userId);
    if (!isMember) throw AppError('Access denied to private project', 403);
  }

  return project;
};

// ── Update ────────────────────────────────────────────────────────────────────
const updateProject = async (projectId, data) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $set: data },
    { new: true, runValidators: true }
  ).select('-aggregateRequiredVector');
  if (!project) throw AppError('Project not found', 404);

  if (data.requiredSkills && data.requiredSkills.length > 0) {
    const skillNames = data.requiredSkills.map((s) => s.name);
    nlpService.ensureSkillVectors(skillNames).catch(console.error);
  }

  return project;
};

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteProject = async (projectId) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { status: 'closed' },
    { new: true }
  );
  if (!project) throw AppError('Project not found', 404);
  // Also remove child tasks
  await Task.deleteMany({ projectId });
  return { message: 'Project deleted' };
};

// ── Finish (complete) ─────────────────────────────────────────────────────────
const finishProject = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .select('ownerId collaborators status title')
    .lean();

  if (!project) throw AppError('Project not found', 404);
  if (project.ownerId.toString() !== userId) {
    throw AppError('Only the project owner can finish a project', 403);
  }
  if (project.status === 'completed') {
    throw AppError('Project is already completed', 422);
  }
  if (project.status === 'closed') {
    throw AppError('Cannot finish a closed project', 422);
  }

  // Transition to completed
  await Project.findByIdAndUpdate(projectId, { $set: { status: 'completed' } });

  // All member user IDs (owner + collaborators)
  const allMemberIds = [
    project.ownerId,
    ...project.collaborators,
  ];

  // Increment collaborationsCompleted for every member
  const { Profile, Notification } = require('../models');
  await Profile.updateMany(
    { userId: { $in: allMemberIds } },
    { $inc: { 'performanceAnalytics.collaborationsCompleted': 1 } }
  );

  // Notify all collaborators
  const { getIO, ROOMS, EVENTS } = require('../config/socket');
  const emit = (room, event, payload) => {
    try { getIO().to(room).emit(event, payload); } catch (_) {}
  };

  for (const collabId of project.collaborators) {
    await Notification.create({
      userId: collabId,
      type: 'system',
      referenceId: projectId,
      referenceModel: 'Project',
      message: `Project "${project.title}" has been marked as completed!`,
    });
    emit(ROOMS.user(collabId.toString()), EVENTS.NOTIF_NEW, { type: 'system' });
  }

  return { message: 'Project completed successfully' };
};

module.exports = {
  createProject,
  getProjects,
  searchProjects,
  getMyProjects,
  getCollaboratingProjects,
  getProjectById,
  updateProject,
  deleteProject,
  finishProject,
};
