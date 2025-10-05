import express from 'express';
import contactController from '../controllers/contactController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  validateContactRevealRequest,
  validateContactRevealResponse,
  validatePagination,
} from '../middleware/validationMiddleware.js';
import {
  generalLimiter,
  contactRevealLimiter,
  socialLimiter,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// POST /api/contact/:userId/request
router.post(
  '/:userId/request',
  verifyToken,
  contactRevealLimiter,
  validateContactRevealRequest,
  contactController.requestContactReveal
);

// PUT /api/contact/:requestId
router.put(
  '/:requestId',
  verifyToken,
  socialLimiter,
  validateContactRevealResponse,
  contactController.respondToContactRequest
);

// GET /api/contact/requests
router.get(
  '/requests',
  verifyToken,
  generalLimiter,
  validatePagination,
  contactController.getContactRequests
);

// GET /api/contact/revealed
router.get(
  '/revealed',
  verifyToken,
  generalLimiter,
  validatePagination,
  contactController.getRevealedContacts
);

// GET /api/contact/sent
router.get(
  '/sent',
  verifyToken,
  generalLimiter,
  validatePagination,
  contactController.getSentContactRequests
);

// DELETE /api/contact/:requestId
router.delete(
  '/:requestId',
  verifyToken,
  socialLimiter,
  contactController.cancelContactRequest
);

// GET /api/contact/:userId/status
router.get(
  '/:userId/status',
  verifyToken,
  generalLimiter,
  contactController.getContactStatus
);

export default router;
