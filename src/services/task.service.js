'use strict';

const { Task, Project } = require('../models');
const paginate = require('../utils/paginate');
const { getIO, ROOMS, EVENTS } = require('../config/socket');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

/* ── Helpers ─────────────────────────────────────────────────────────────────*/
const assertMember = (project, userId) => {
  const isOwner = project.ownerId.toString() === userId;
  const isCollab = (project.collaborators || []).some((id) => id.toString() === userId);
  if (!isOwner && !isCollab) throw AppError('Not a project member', 403);
};

/** Safely emit a socket event — no-op during tests (io not initialised). */
const emit = (room, event, payload) => {
  try { getIO().to(room).emit(event, payload); } catch (_) {}
};

/* ── Create ───────────────────────────────────────────────────────────────────*/
const createTask = async (projectId, ownerId, data) => {
  if (data.assignedTo) {
    const project = await Project.findById(projectId).select('ownerId collaborators').lean();
    if (!project) throw AppError('Project not found', 404);
    assertMember(project, data.assignedTo.toString());
  }

  const task = await Task.create({ ...data, projectId });
  await Project.findByIdAndUpdate(projectId, { $push: { tasks: task._id } });

  /* ── Real-time: broadcast to all members in the project room ─ */
  emit(ROOMS.project(projectId), EVENTS.TASK_CREATED, { task, projectId });

  /* ── Real-time: notify assignee personally ─────────────────── */
  if (data.assignedTo) {
    emit(ROOMS.user(data.assignedTo), EVENTS.TASK_ASSIGNED, {
      task,
      projectId,
      message: 'You have been assigned a new task.',
    });
  }

  return task;
};

/* ── Read (list) ──────────────────────────────────────────────────────────────*/
const getTasksByProject = async (projectId, query) => {
  const { status, assignedTo, page: p, limit: l } = query;
  const { skip, limit, buildMeta } = paginate({ page: p, limit: l });

  const filter = { projectId };
  if (status)     filter.status     = status;
  if (assignedTo) filter.assignedTo = assignedTo;

  const [total, tasks] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter)
      .populate('assignedTo', 'username')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { tasks, pagination: buildMeta(total) };
};

/* ── Read (single) ────────────────────────────────────────────────────────────*/
const getTaskById = async (taskId, projectId) => {
  const task = await Task.findOne({ _id: taskId, projectId })
    .populate('assignedTo', 'username')
    .lean();
  if (!task) throw AppError('Task not found', 404);
  return task;
};

/* ── Update (fields) ─────────────────────────────────────────────────────────*/
const updateTask = async (taskId, projectId, data) => {
  const previousTask = await Task.findOne({ _id: taskId, projectId }).lean();
  if (!previousTask) throw AppError('Task not found', 404);

  const task = await Task.findOneAndUpdate(
    { _id: taskId, projectId },
    { $set: data },
    { new: true, runValidators: true }
  ).populate('assignedTo', 'username');
  if (!task) throw AppError('Task not found', 404);

  /* ── Real-time: broadcast field changes to project room ──── */
  emit(ROOMS.project(projectId), EVENTS.TASK_UPDATED, { task, projectId });

  /* ── Real-time: notify new assignee ─────────────────────── */
  const prevAssignee = previousTask.assignedTo?.toString();
  const newAssignee  = data.assignedTo?.toString();
  if (newAssignee && newAssignee !== prevAssignee) {
    emit(ROOMS.user(newAssignee), EVENTS.TASK_ASSIGNED, {
      task,
      projectId,
      message: 'You have been assigned a task.',
    });
  }

  return task;
};

/* ── Update (status only) ────────────────────────────────────────────────────*/
const updateTaskStatus = async (taskId, projectId, status, requesterId) => {
  const task = await Task.findOne({ _id: taskId, projectId }).lean();
  if (!task) throw AppError('Task not found', 404);

  const project = await Project.findById(projectId).select('ownerId collaborators').lean();
  if (!project) throw AppError('Project not found', 404);

  assertMember(project, requesterId);

  const updated = await Task.findByIdAndUpdate(
    taskId,
    { status },
    { new: true }
  ).populate('assignedTo', 'username');

  /* ── Real-time: kanban column move for all project members ── */
  emit(ROOMS.project(projectId), EVENTS.TASK_STATUS, {
    taskId,
    status,
    projectId,
    updatedBy: requesterId,
    task: updated,
  });

  return updated;
};

/* ── Delete ───────────────────────────────────────────────────────────────────*/
const deleteTask = async (taskId, projectId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, projectId });
  if (!task) throw AppError('Task not found', 404);
  await Project.findByIdAndUpdate(projectId, { $pull: { tasks: taskId } });

  /* ── Real-time: remove task card from all members' views ─── */
  emit(ROOMS.project(projectId), EVENTS.TASK_DELETED, { taskId, projectId });

  return { message: 'Task deleted' };
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
