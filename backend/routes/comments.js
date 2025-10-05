import express from 'express';
import commentController from '../controllers/commentController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';
import {
  validateCreateComment,
  validatePagination,
} from '../middleware/validationMiddleware.js';
import {
  handleAudioUpload,
  cleanupTempFiles,
} from '../middleware/uploadMiddleware.js';
import {
  generalLimiter,
  socialLimiter,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// GET /api/posts/:postId/comments
router.get(
  '/posts/:postId/comments',
  optionalAuth,
  generalLimiter,
  validatePagination,
  commentController.getPostComments
);

// POST /api/posts/:postId/comments
router.post(
  '/posts/:postId/comments',
  verifyToken,
  socialLimiter,
  handleAudioUpload,
  cleanupTempFiles,
  validateCreateComment,
  commentController.createComment
);

// DELETE /api/comments/:commentId
router.delete(
  '/:commentId',
  verifyToken,
  socialLimiter,
  commentController.deleteComment
);

// GET /api/comments/:commentId/replies
router.get(
  '/:commentId/replies',
  optionalAuth,
  generalLimiter,
  validatePagination,
  commentController.getCommentReplies
);

// POST /api/comments/:commentId/like
router.post(
  '/:commentId/like',
  verifyToken,
  socialLimiter,
  commentController.toggleLike
);

// GET /api/comments/:commentId/likes
router.get(
  '/:commentId/likes',
  optionalAuth,
  generalLimiter,
  validatePagination,
  commentController.getCommentLikes
);

// PUT /api/comments/:commentId
router.put(
  '/:commentId',
  verifyToken,
  socialLimiter,
  commentController.updateComment
);

// GET /api/comments/user/:userId
router.get(
  '/user/:userId',
  optionalAuth,
  generalLimiter,
  validatePagination,
  commentController.getUserComments
);

export default router;
