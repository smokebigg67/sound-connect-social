import { verifyAccessToken, verifyRefreshToken } from '../config/auth.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found.',
      });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user for optional auth
    next();
  }
};

const verifyRefreshTokenMiddleware = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required.',
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token or user not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token.',
    });
  }
};

// Middleware to check if user has Google Drive connected
const requireGoogleDrive = async (req, res, next) => {
  try {
    if (!req.user.storage.googleDriveToken) {
      return res.status(400).json({
        success: false,
        message:
          'Google Drive connection required. Please connect your Google Drive account.',
      });
    }

    // Check if token is expired
    if (req.user.isGoogleDriveTokenExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive token expired. Please reconnect your account.',
      });
    }

    next();
  } catch (error) {
    logger.error('Google Drive verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Google Drive connection.',
    });
  }
};

// Middleware to check if users are connected
const requireConnection = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const Connection = (await import('../models/Connection.js')).default;

    const connection = await Connection.findOne({
      status: 'accepted',
      $or: [
        { requesterId: req.user._id, recipientId: userId },
        { requesterId: userId, recipientId: req.user._id },
      ],
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: 'You must be connected with this user to perform this action.',
      });
    }

    next();
  } catch (error) {
    logger.error('Connection verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify connection status.',
    });
  }
};

// Middleware to check if user is the owner of the resource
const isResourceOwner = (resourceIdField = 'userId') => {
  return (req, res, next) => {
    try {
      const resourceId =
        req.params[resourceIdField] || req.body[resourceIdField];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID not provided.',
        });
      }

      if (!req.user._id.equals(resourceId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this resource.',
        });
      }

      next();
    } catch (error) {
      logger.error('Resource ownership verification failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify resource ownership.',
      });
    }
  };
};

export {
  verifyToken,
  optionalAuth,
  verifyRefreshTokenMiddleware as verifyRefreshToken,
  requireGoogleDrive,
  requireConnection,
  isResourceOwner,
};
