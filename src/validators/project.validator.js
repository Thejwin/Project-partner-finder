'use strict';

const Joi = require('joi');

const createProject = Joi.object({
  title:         Joi.string().min(3).max(120).required(),
  description:   Joi.string().min(10).max(5000).required(),
  date:          Joi.date().required(),
  type:          Joi.string().valid('Chat', 'Free').required(),
  tags:          Joi.array().items(Joi.string()).max(20),
  visibility:    Joi.string().valid('public', 'private').default('public'),
  requiredSkills: Joi.array().items(
    Joi.object({
      name:       Joi.string().max(100).required(),
      importance: Joi.string().valid('nice-to-have','required','critical').default('required'),
    })
  ).max(30),
});

const updateProject = Joi.object({
  title:         Joi.string().min(3).max(120),
  description:   Joi.string().min(10).max(5000),
  date:          Joi.date(),
  type:          Joi.string().valid('Chat', 'Free'),
  tags:          Joi.array().items(Joi.string()).max(20),
  visibility:    Joi.string().valid('public', 'private'),
  status:        Joi.string().valid('open','in-progress','completed','closed'),
  requiredSkills: Joi.array().items(
    Joi.object({
      name:       Joi.string().max(100).required(),
      importance: Joi.string().valid('nice-to-have','required','critical').default('required'),
    })
  ).max(30),
});

module.exports = { createProject, updateProject };
