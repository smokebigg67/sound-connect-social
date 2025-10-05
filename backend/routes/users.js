import express from 'express';
import userController from '../controllers/userController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';
import {
  validateUpdateProfile,
  validateUserSearch,
  validatePagination,
} from '../middleware/validationMiddleware.js';
import {
  generalLimiter,
  searchLimiter,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// GET /api/users/me
router.get('/me', verifyToken, generalLimiter, userController.getCurrentUser);

// PUT /api/users/me
router.put(
  '/me',
  verifyToken,
  generalLimiter,
  validateUpdateProfile,
  userController.updateProfile
);

// GET /api/users/:userId
router.get(
  '/:userId',
  optionalAuth,
  generalLimiter,
  userController.getUserProfile
);

// GET /api/users/search
router.get(
  '/search',
  verifyToken,
  searchLimiter,
  validateUserSearch,
  userController.searchUsers
);

// GET /api/users/me/connections
router.get(
  '/me/connections',
  verifyToken,
  generalLimiter,
  validatePagination,
  userController.getUserConnections
);

// GET /api/users/me/stats
router.get(
  '/me/stats',
  verifyToken,
  generalLimiter,
  userController.getUserStats
);

// GET /api/users/me/storage
router.get(
  '/me/storage',
  verifyToken,
  generalLimiter,
  userController.getStorageInfo
);

// PUT /api/users/me/storage/preference
router.put(
  '/me/storage/preference',
  verifyToken,
  generalLimiter,
  userController.updateStoragePreference
);

// POST /api/users/me/avatar
router.post(
  '/me/avatar',
  verifyToken,
  generalLimiter,
  userController.uploadAvatar
);

// DELETE /api/users/me/avatar
router.delete(
  '/me/avatar',
  verifyToken,
  generalLimiter,
  userController.deleteAvatar
);

export default router;
