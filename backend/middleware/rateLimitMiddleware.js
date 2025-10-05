onst rateLimit = require('express-rate-limit');
const config = require('../config/environment');
const logger = require('../utils/logger');

// General rate limiter for all API routes
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(config.RATE_LIMIT_WINDOW_MS / 1000)
    });
  }
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 900
    });
  }
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later.',
      retryAfter: 3600
    });
  }
});

// Rate limiter for social actions (connections, likes, comments)
const socialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 social actions per 15 minutes
  message: {
    success: false,
    message: 'Too many social actions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Social rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many social actions, please try again later.',
      retryAfter: 900
    });
  }
});

// Rate limiter for search endpoints
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many search requests, please try again later.',
      retryAfter: 60
    });
  }
});

// Rate limiter for contact reveal requests
const contactRevealLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 contact reveal requests per day
  message: {
    success: false,
    message: 'Too many contact reveal requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Contact reveal rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many contact reveal requests, please try again later.',
      retryAfter: 86400
    });
  }
});

// Rate limiter for post creation
const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user to 5 posts per hour
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: {
    success: false,
    message: 'Too many posts created, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Post creation rate limit exceeded:', {
      userId: req.user ? req.user._id : 'anonymous',
      ip: req.ip,
      url: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many posts created, please try again later.',
      retryAfter: 3600
    });
  }
});

// Rate limiter for connection requests
const connectionRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // Limit each user to 20 connection requests per day
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: {
    success: false,
    message: 'Too many connection requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Connection request rate limit exceeded:', {
      userId: req.user ? req.user._id : 'anonymous',
      ip: req.ip,
      url: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many connection requests, please try again later.',
      retryAfter: 86400
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  socialLimiter,
  searchLimiter,
  contactRevealLimiter,
  postCreationLimiter,
  connectionRequestLimiter
};