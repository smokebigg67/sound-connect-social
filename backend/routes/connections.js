import express from 'express';
import connectionController from '../controllers/connectionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  validateConnectionRequest,
  validateConnectionResponse,
  validatePagination,
} from '../middleware/validationMiddleware.js';
import {
  generalLimiter,
  connectionRequestLimiter,
  socialLimiter,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// GET /api/connections/pending
router.get(
  '/pending',
  verifyToken,
  generalLimiter,
  validatePagination,
  connectionController.getPendingRequests
);

// POST /api/connections/:userId/request
router.post(
  '/:userId/request',
  verifyToken,
  connectionRequestLimiter,
  validateConnectionRequest,
  connectionController.sendConnectionRequest
);

// PUT /api/connections/:requestId
router.put(
  '/:requestId',
  verifyToken,
  socialLimiter,
  validateConnectionResponse,
  connectionController.respondToRequest
);

// DELETE /api/connections/:userId
router.delete(
  '/:userId',
  verifyToken,
  socialLimiter,
  connectionController.removeConnection
);

// GET /api/connections/suggestions
router.get(
  '/suggestions',
  verifyToken,
  generalLimiter,
  validatePagination,
  connectionController.getConnectionSuggestions
);

// GET /api/connections/me
router.get(
  '/me',
  verifyToken,
  generalLimiter,
  validatePagination,
  connectionController.getUserConnections
);

// GET /api/connections/sent
router.get(
  '/sent',
  verifyToken,
  generalLimiter,
  validatePagination,
  connectionController.getSentRequests
);

// GET /api/connections/blocked
router.get(
  '/blocked',
  verifyToken,
  generalLimiter,
  validatePagination,
  connectionController.getBlockedUsers
);

// POST /api/connections/:userId/block
router.post(
  '/:userId/block',
  verifyToken,
  socialLimiter,
  connectionController.blockUser
);

// POST /api/connections/:userId/unblock
router.post(
  '/:userId/unblock',
  verifyToken,
  socialLimiter,
  connectionController.unblockUser
);

export default router;
