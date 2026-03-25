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

module.exports = {
  createProject,
  getProjects,
  searchProjects,
  getMyProjects,
  getCollaboratingProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
