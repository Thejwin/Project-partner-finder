'use strict';

const Joi = require('joi');

const updateProfile = Joi.object({
  name:            Joi.string().max(80),
  age:             Joi.number().integer().min(13).max(120),
  description:     Joi.string().max(1000),
  header:          Joi.string().max(160),
  location:        Joi.string().max(100),
  website:         Joi.string().uri(),
  portfolioLink:   Joi.string().uri(),
  areasOfInterest: Joi.array().items(Joi.string()).max(20),
  links: Joi.array().items(
    Joi.object({
      platform: Joi.string().valid('github','linkedin','twitter','portfolio','other').required(),
      url:      Joi.string().uri().required(),
    })
  ),
  education: Joi.array().items(
    Joi.object({
      institution:  Joi.string().required(),
      degree:       Joi.string(),
      fieldOfStudy: Joi.string(),
      startYear:    Joi.number().integer().min(1900).max(2100),
      endYear:      Joi.number().integer().min(1900).max(2100),
    })
  ),
  experience: Joi.array().items(
    Joi.object({
      company:     Joi.string().required(),
      role:        Joi.string().required(),
      description: Joi.string().max(500),
      startDate:   Joi.date(),
      endDate:     Joi.date(),
      current:     Joi.boolean(),
    })
  ),
});

const updateSkills = Joi.object({
  skills: Joi.array().items(
    Joi.object({
      name:  Joi.string().max(100).required(),
      level: Joi.string().valid('beginner', 'intermediate', 'expert').required(),
    })
  ).max(50).required(),
});

module.exports = { updateProfile, updateSkills };
