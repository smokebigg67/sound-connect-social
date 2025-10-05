import express from 'express';
import postController from '../controllers/postController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';
import {
  validateCreatePost,
  validatePagination,
} from '../middleware/validationMiddleware.js';
import {
  handleAudioUpload,
  cleanupTempFiles,
} from '../middleware/uploadMiddleware.js';
import {
  generalLimiter,
  postCreationLimiter,
  socialLimiter,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// GET /api/posts/feed
router.get(
  '/feed',
  verifyToken,
  generalLimiter,
  validatePagination,
  postController.getUserFeed
);

// POST /api/posts
router.post(
  '/',
  verifyToken,
  postCreationLimiter,
  handleAudioUpload,
  cleanupTempFiles,
  validateCreatePost,
  postController.createPost
);

// GET /api/posts/:postId
router.get('/:postId', optionalAuth, generalLimiter, postController.getPost);

// DELETE /api/posts/:postId
router.delete(
  '/:postId',
  verifyToken,
  socialLimiter,
  postController.deletePost
);

// GET /api/posts/user/:userId
router.get(
  '/user/:userId',
  optionalAuth,
  generalLimiter,
  validatePagination,
  postController.getUserPosts
);

// POST /api/posts/:postId/like
router.post(
  '/:postId/like',
  verifyToken,
  socialLimiter,
  postController.toggleLike
);

// GET /api/posts/:postId/likes
router.get(
  '/:postId/likes',
  optionalAuth,
  generalLimiter,
  validatePagination,
  postController.getPostLikes
);

// PUT /api/posts/:postId
router.put('/:postId', verifyToken, socialLimiter, postController.updatePost);

// GET /api/posts/trending
router.get(
  '/trending',
  optionalAuth,
  generalLimiter,
  validatePagination,
  postController.getTrendingPosts
);

// GET /api/posts/explore
router.get(
  '/explore',
  optionalAuth,
  generalLimiter,
  validatePagination,
  postController.getExplorePosts
);

// POST /api/posts/:postId/listen
router.post(
  '/:postId/listen',
  verifyToken,
  socialLimiter,
  postController.recordListen
);

// GET /api/posts/:postId/stats
router.get(
  '/:postId/stats',
  verifyToken,
  generalLimiter,
  postController.getPostStats
);

export default router;
