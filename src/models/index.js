/**
 * models/index.js
 * Barrel export for all Mongoose models.
 * Import from here instead of individual files to keep imports clean.
 *
 * Usage:
 *   const { User, Profile, Project } = require('../models');
 */

const User          = require('./User.model');
const Profile       = require('./Profile.model');
const Project       = require('./Project.model');
const Task          = require('./Task.model');
const Friendship    = require('./Friendship.model');
const Message       = require('./Message.model');
const Notification  = require('./Notification.model');
const Recommendation = require('./Recommendation.model');
const SkillVector   = require('./SkillVector.model');
const SkillMatchScore = require('./SkillMatchScore.model');
const Rating        = require('./Rating.model');
const Report        = require('./Report.model');

module.exports = {
  User,
  Profile,
  Project,
  Task,
  Friendship,
  Message,
  Notification,
  Recommendation,
  SkillVector,
  SkillMatchScore,
  Rating,
  Report,
};
