'use strict';

const axios = require('axios');
const env = require('../config/env');

/**
 * Axios client pre-configured to point to the Python NLP microservice.
 */
const nlpClient = axios.create({
  baseURL: env.NLP_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Sends a list of skill names to the AI service to ensure their embeddings exist.
 * This is an async fire-and-forget operation, meaning we don't block the JS response.
 * @param {string[]} skills - Array of skill names like ['react', 'node.js']
 */
const ensureSkillVectors = async (skills) => {
  if (!skills || skills.length === 0) return;
  try {
    await nlpClient.post('/api/vectors/generate', { skills });
  } catch (err) {
    // Only log, do not crash backend if Python service is down
    console.error('[NLP Service Error] Failed to generate vectors:', err.message);
  }
};

/**
 * Computes AI match scores for a user and project.
 * Not heavily used synchronously right now, usually done async or lazily.
 * @param {string} userId
 * @param {string} projectId 
 */
const computeMatch = async (userId, projectId) => {
  try {
    const res = await nlpClient.post('/api/match/compute', { userId, projectId });
    
    // The Python service might return a 200 OK but with an "error" field in the body
    if (res.data && res.data.error) {
      console.warn(`[NLP Service Warning] Match computation returned error for User ${userId}, Project ${projectId}:`, res.data.error);
      return res.data;
    }

    return res.data;
  } catch (err) {
    const detail = err.response?.data?.error || err.response?.data || err.message;
    console.error(`[NLP Service Error] Failed to compute match for User ${userId}, Project ${projectId}:`, detail);
    return null;
  }
};

module.exports = {
  ensureSkillVectors,
  computeMatch,
};
