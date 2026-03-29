'use strict';

const taskService   = require('../services/task.service');
const { logActivity } = require('../services/activity.service');
const { success, created } = require('../utils/apiResponse');
const asyncHandler  = require('../utils/asyncHandler');

exports.createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(
    req.params.projectId,
    req.user._id,
    req.body
  );

  await logActivity({
    projectId: req.params.projectId,
    userId: req.user._id,
    type: 'TASK_CREATED',
    description: `Created task: ${task.title}`,
    metadata: { taskId: task._id }
  });

  created(res, { task });
});

exports.getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasksByProject(req.params.projectId, req.query);
  success(res, result);
});

exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId, req.params.projectId);
  success(res, { task });
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.taskId,
    req.params.projectId,
    req.body
  );
  success(res, { task });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskStatus(
    req.params.taskId,
    req.params.projectId,
    req.body.status,
    req.user._id
  );

  await logActivity({
    projectId: req.params.projectId,
    userId: req.user._id,
    type: 'TASK_STATUS_CHANGED',
    description: `Changed task status: ${task.title} to ${req.body.status}`,
    metadata: { taskId: task._id, status: req.body.status }
  });

  success(res, { task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.params.taskId, req.params.projectId);
  success(res, result);
});
