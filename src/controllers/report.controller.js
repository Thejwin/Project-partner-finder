'use strict';

const { Report } = require('../models');
const { success } = require('../utils/apiResponse');

/**
 * @desc    Submit a new report
 * @route   POST /api/reports
 * @access  Private
 */
const submitReport = async (req, res, next) => {
  try {
    const { reportedUser, reportedProject, reason, description } = req.body;

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUser || undefined,
      reportedProject: reportedProject || undefined,
      reason,
      description,
    });

    return success(res, { report }, 201);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  submitReport,
};
