'use strict';

const { User, Project, Report } = require('../models');
const { success, error } = require('../utils/apiResponse');

/**
 * @desc    Get platform statistics
 * @route   GET /api/admin/stats
 * @access  Private / Admin
 */
const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'open' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    return success(res, {
      stats: { totalUsers, activeProjects, pendingReports },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Get all reports
 * @route   GET /api/admin/reports
 * @access  Private / Admin
 */
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'username profilePicture')
      .populate('reportedUser', 'username profilePicture')
      .populate('reportedProject', 'title')
      .sort({ createdAt: -1 });

    return success(res, { reports });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Update report status
 * @route   PATCH /api/admin/reports/:id
 * @access  Private / Admin
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) return error(res, 'Report not found', 404);

    return success(res, { report });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Ban or unban a user
 * @route   PATCH /api/admin/users/:id/ban
 * @access  Private / Admin
 */
const toggleUserBan = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'ban' or 'unban'
    
    if (req.params.id === req.user._id.toString()) {
      return error(res, 'You cannot ban yourself', 400);
    }

    const isActive = action !== 'ban';
    const bannedReason = isActive ? null : reason;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive, bannedReason },
      { new: true }
    ).select('-password');

    if (!user) return error(res, 'User not found', 404);

    // Optionally: if banned, emit a socket event to force logout immediately

    return success(res, { user });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Delete a project (admin override)
 * @route   DELETE /api/admin/projects/:id
 * @access  Private / Admin
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return error(res, 'Project not found', 404);
    
    // Optionally: clean up related tasks, memberships, etc.
    return success(res, { message: 'Project deleted by admin' });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Promote self to admin (For testing convenience)
 * @route   PATCH /api/admin/make-me-admin
 * @access  Private
 */
const promoteToAdmin = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role: 'admin' },
      { new: true }
    );
    return success(res, { user, message: 'You are now an admin!' });
  } catch (err) {
    return next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return success(res, { users });
  } catch (err) {
    return next(err);
  }
};

const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('ownerId', 'username email')
      .sort({ createdAt: -1 });

    return success(res, { projects });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getStats,
  getReports,
  updateReportStatus,
  toggleUserBan,
  deleteProject,
  promoteToAdmin,
  getAllUsers,
  getAllProjects,
};
