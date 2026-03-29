'use strict';

const { Activity } = require('../models');

/**
 * Log a project activity event.
 * @param {string} projectId - ID of the project
 * @param {string} userId - ID of the actor
 * @param {string} type - Enum value (e.g. 'TASK_CREATED')
 * @param {string} description - Human readable description (e.g. 'created task: Buy groceries')
 * @param {object} metadata - Optional extra data
 */
const logActivity = async ({ projectId, userId, type, description, metadata = {} }) => {
  try {
    return await Activity.create({
      projectId,
      userId,
      type,
      description,
      metadata
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
    // Non-blocking catch
    return null;
  }
};

/**
 * Fetch activities for a project.
 * @param {string} projectId - Filter by project
 * @param {object} query - Pagination params
 */
const getActivitiesByProject = async (projectId, query = {}) => {
  const { limit = 20, page = 1 } = query;
  const skip = (page - 1) * limit;

  const activities = await Activity.find({ projectId })
    .populate('userId', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return activities;
};

module.exports = {
  logActivity,
  getActivitiesByProject,
};
