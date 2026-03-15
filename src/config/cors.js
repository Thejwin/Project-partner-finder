'use strict';

const env = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [env.CLIENT_URL, 'http://localhost:3000'];
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = corsOptions;
