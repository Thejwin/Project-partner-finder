'use strict';

require('dotenv').config();

const http = require('http');
const app  = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const env = require('./src/config/env');

const PORT = env.PORT || 5000;

(async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP server and attach Socket.io
  const server = http.createServer(app);
  initSocket(server);

  // 3. Start listening
  server.listen(PORT, () => {
    console.log(`🚀 ProjectConnect API running on port ${PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
})();
