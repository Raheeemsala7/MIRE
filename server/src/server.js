const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');

const server = http.createServer(app);

// Initialize Real-time Socket.IO
initSocket(server, env.CORS_ORIGIN);

// Start server after DB connection
const startServer = async () => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      logger.info(`====================================================`);
      logger.info(`✨ MIRE E-Commerce Server is running on port: ${env.PORT}`);
      logger.info(`🌐 Environment: ${env.NODE_ENV}`);
      logger.info(`📚 Swagger Documentation available at: http://localhost:${env.PORT}/api-docs`);
      logger.info(`⚡ API Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`====================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Closing HTTP server and database connections...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
