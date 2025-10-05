import express from 'express';
import authController from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
} from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validateRegister,
  authController.register
);

// POST /api/auth/login
router.post('/login', authLimiter, validateLogin, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/auth/google-drive
router.post('/google-drive', authController.connectGoogleDrive);

// GET /api/auth/google/url
router.get('/google/url', authController.getGoogleAuthUrl);

// GET /api/auth/google/callback
router.get('/google/callback', authController.handleGoogleCallback);

export default router;
