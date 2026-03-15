'use strict';

const Joi = require('joi');

const register = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  termsAccepted: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'You must accept the terms and conditions' }),
});

const login = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { register, login, refreshToken };
