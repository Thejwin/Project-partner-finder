'use strict';

/**
 * Centralised env-var loader.
 * All process.env access should go through this module —
 * never scatter process.env throughout the codebase.
 */
const required = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  MONGO_URI: process.env.MONGO_URI,

  // JWT
  JWT_ACCESS_SECRET:      process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET:     process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN:  process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Cloudinary (optional — needed only for media uploads)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // AI microservice
  NLP_SERVICE_URL: process.env.NLP_SERVICE_URL || 'http://localhost:8000',

  // Client origin for CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
