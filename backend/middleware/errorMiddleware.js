import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : 'anonymous',
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Multer errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many form fields';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        break;
    }

    error = { message, statusCode: 400 };
  }

  // Google API errors
  if (err.message && err.message.includes('Google Drive')) {
    error = {
      message: 'Google Drive service error',
      statusCode: 503,
      details: err.message,
    };
  }

  // Network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = {
      message: 'Service unavailable',
      statusCode: 503,
    };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = {
      message: 'Database connection error',
      statusCode: 503,
    };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
    ...(error.details && { details: error.details }),
  });
};

// 404 handler for routes that don't exist
const notFound = (req, res, next) => {
  logger.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    logger.warn('Validation error:', {
      errors,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  next(err);
};

// Handle unhandled promise rejections
const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', err);

    // Don't crash the server in production
    if (process.env.NODE_ENV === 'production') {
      logger.error('Unhandled promise rejection:', err);
    } else {
      // In development, crash to catch errors early
      process.exit(1);
    }
  });
};

// Handle uncaught exceptions
const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);

    // Don't crash the server in production
    if (process.env.NODE_ENV === 'production') {
      logger.error('Uncaught exception:', err);
    } else {
      // In development, crash to catch errors early
      process.exit(1);
    }
  });
};

export {
  errorHandler,
  notFound,
  asyncHandler,
  validationErrorHandler,
  handleUnhandledRejections,
  handleUncaughtExceptions,
};
