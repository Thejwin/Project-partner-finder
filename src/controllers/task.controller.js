'use strict';

const taskService   = require('../services/task.service');
const { success, created } = require('../utils/apiResponse');
const asyncHandler  = require('../utils/asyncHandler');

exports.createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(
    req.params.projectId,
    req.user._id,
    req.body
  );
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
  success(res, { task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.params.taskId, req.params.projectId);
  success(res, result);
});
