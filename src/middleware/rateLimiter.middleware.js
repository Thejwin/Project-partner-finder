'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for auth endpoints — prevents brute-force.
 * 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

/**
 * General API limiter — applies to all other routes.
 * 100 requests per minute per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit exceeded.' },
});

module.exports = { authLimiter, generalLimiter };
