'use strict';

/**
 * Wraps an async route handler and forwards any thrown error to Express's
 * next() — removes the need for try/catch in every controller.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
