'use strict';

/**
 * Standard API response factories.
 * Controllers should always use these to ensure a uniform envelope.
 */

const success = (res, data = {}, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

const created = (res, data = {}) => success(res, data, 201);

const noContent = (res) => res.status(204).send();

const error = (res, message = 'Something went wrong', statusCode = 500, details = null) =>
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
  });

module.exports = { success, created, noContent, error };
