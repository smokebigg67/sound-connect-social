import app from './app.js';
import config from './config/environment.js';
import { logger } from './utils/logger.js';
import audioUtils from './utils/audioUtils.js';

const PORT = config.PORT || 5000;

// Create HTTP server
const server = app.listen(PORT, () => {
  logger.info(`
    🚀 VoiceConnect Backend Server started successfully!
    📍 Environment: ${config.NODE_ENV}
    🌐 Port: ${PORT}
    📊 Health Check: http://localhost:${PORT}/health
    📚 API Documentation: http://localhost:${PORT}/api
    ⏰ Started at: ${new Date().toISOString()}
    
    📋 Connected Services:
    🗄️  Database: ${config.MONGODB_URI ? '✅ Connected' : '❌ Not configured'}
    🔐 Google OAuth: ${
      config.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'
    }
    📁 Uploads: ./uploads/
    📝 Logs: ./logs/
  `);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error('Server error:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Starting graceful shutdown...');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Periodic cleanup tasks
const startCleanupTasks = () => {
  // Clean up temporary audio files every hour
  setInterval(async () => {
    try {
      await audioUtils.cleanupTempFiles();
      logger.info('Temporary files cleanup completed');
    } catch (error) {
      logger.error('Temporary files cleanup failed:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  // Log server stats every 5 minutes
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    logger.info('Server Stats:', {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor(
        (uptime % 3600) / 60
      )}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      connections: server.connections,
    });
  }, 5 * 60 * 1000); // Every 5 minutes
};

// Start cleanup tasks
startCleanupTasks();

// Export server for testing
export default server;
