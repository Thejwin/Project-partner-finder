'use strict';

const Joi = require('joi');

const createTask = Joi.object({
  title:       Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000),
  assignedTo:  Joi.string().hex().length(24),      // ObjectId string
  priority:    Joi.string().valid('low','medium','high').default('medium'),
  dueDate:     Joi.date(),
});

const updateTask = Joi.object({
  title:       Joi.string().min(2).max(200),
  description: Joi.string().max(2000),
  assignedTo:  Joi.string().hex().length(24),
  priority:    Joi.string().valid('low','medium','high'),
  dueDate:     Joi.date(),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('todo','in-progress','done').required(),
});

module.exports = { createTask, updateTask, updateStatus };
