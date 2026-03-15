'use strict';

const { verifyAccessToken } = require('../utils/token');
const { error } = require('../utils/apiResponse');
const { User } = require('../models');

/**
 * Protect routes — validates Bearer JWT and attaches req.user.
 * req.user = { _id, username }
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Lightweight DB check — ensures user still exists and is active
    const user = await User.findById(payload._id).select('_id username isActive').lean();
    if (!user || !user.isActive) {
      return error(res, 'User not found or deactivated', 401);
    }

    req.user = { _id: user._id.toString(), username: user.username };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Access token expired', 401);
    }
    return error(res, 'Invalid token', 401);
  }
};

module.exports = { protect };
