import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/auth.js';
import { getAuthUrl, getAccessToken } from '../config/cloudStorage.js';
import audioService from '../services/audioService.js';
import { logger } from '../utils/logger.js';

const authController = {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { username, email, password, displayName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        profile: {
          displayName: displayName || username
        }
      });

      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      logger.info('User registered successfully:', { userId: user._id, username });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.getPublicProfile(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  },

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      logger.info('User logged in successfully:', { userId: user._id, email });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getPublicProfile(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Login failed:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  },

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just acknowledge the logout request
      
      logger.info('User logged out:', { userId: req.user?._id });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      logger.info('Access token refreshed:', { userId: user._id });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: error.message
      });
    }
  },

  /**
   * Connect Google Drive account
   */
  async connectGoogleDrive(req, res) {
    try {
      const { code } = req.body;
      const userId = req.user._id;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code required'
        });
      }

      // Exchange authorization code for tokens
      const tokens = await getAccessToken(code);

      // Update user's Google Drive tokens
      const user = await User.findByIdAndUpdate(
        userId,
        {
          'storage.googleDriveToken': tokens,
          'storage.preference': 'google_drive'
        },
        { new: true }
      );

      logger.info('Google Drive connected successfully:', { userId });

      res.json({
        success: true,
        message: 'Google Drive connected successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      logger.error('Google Drive connection failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect Google Drive',
        error: error.message
      });
    }
  },

  /**
   * Get Google OAuth authorization URL
   */
  async getGoogleAuthUrl(req, res) {
    try {
      const authUrl = getAuthUrl();

      res.json({
        success: true,
        message: 'Authorization URL generated',
        data: {
          authUrl
        }
      });
    } catch (error) {
      logger.error('Failed to generate auth URL:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate authorization URL',
        error: error.message
      });
    }
  },

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code required'
        });
      }

      // Exchange authorization code for tokens
      const tokens = await getAccessToken(code);

      // If state contains user ID, update existing user
      if (state) {
        const user = await User.findByIdAndUpdate(
          state,
          {
            'storage.googleDriveToken': tokens,
            'storage.preference': 'google_drive'
          },
          { new: true }
        );

        if (user) {
          logger.info('Google Drive connected via callback:', { userId: state });
          
          // Redirect to frontend with success
          return res.redirect(`${process.env.FRONTEND_URL}/settings?google_drive=success`);
        }
      }

      // If no state or user not found, return tokens
      res.json({
        success: true,
        message: 'Google Drive authentication successful',
        data: {
          tokens
        }
      });
    } catch (error) {
      logger.error('Google OAuth callback failed:', error);
      
      // Redirect to frontend with error
      const errorParam = encodeURIComponent(error.message);
      res.redirect(`${process.env.FRONTEND_URL}/settings?google_drive=error&message=${errorParam}`);
    }
  }
};

export default authController;