import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config/environment.js';

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }

    return msg;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: fileFormat,
  defaultMeta: { service: 'voiceconnect-backend' },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: config.LOG_FILE,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Write error logs to separate file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Add console transport for non-production environments
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Add request logging middleware
const requestLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'voiceconnect-requests' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'requests.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Express middleware for request logging
const expressRequestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when request finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id || 'anonymous',
    };

    requestLogger.info('HTTP Request', logData);
  });

  next();
};

// Database logging
const dbLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'voiceconnect-database' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'database.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Security logging
const securityLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'voiceconnect-security' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Performance logging
const performanceLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'voiceconnect-performance' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'performance.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Helper function to log performance metrics
const logPerformance = (operation, duration, metadata = {}) => {
  performanceLogger.info('Performance Metric', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Helper function to log security events
const logSecurityEvent = (event, metadata = {}) => {
  securityLogger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Helper function to log database operations
const logDatabaseOperation = (operation, collection, query, duration) => {
  dbLogger.info('Database Operation', {
    operation,
    collection,
    query: JSON.stringify(query),
    duration,
    timestamp: new Date().toISOString(),
  });
};

// Helper function to log user activities
const logUserActivity = (userId, activity, metadata = {}) => {
  logger.info('User Activity', {
    userId,
    activity,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Helper function to log API errors
const logApiError = (error, req, res) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id || 'anonymous',
    timestamp: new Date().toISOString(),
  });
};

// Helper function to log successful operations
const logSuccess = (operation, metadata = {}) => {
  logger.info('Operation Success', {
    operation,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Helper function to log warnings
const logWarning = (message, metadata = {}) => {
  logger.warn('Warning', {
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Helper function to log debug information
const logDebug = (message, metadata = {}) => {
  logger.debug('Debug', {
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

export {
  logger,
  requestLogger,
  dbLogger,
  securityLogger,
  performanceLogger,
  expressRequestLogger,
  logPerformance,
  logSecurityEvent,
  logDatabaseOperation,
  logUserActivity,
  logApiError,
  logSuccess,
  logWarning,
  logDebug,
};
