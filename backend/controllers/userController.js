import User from '../models/User.js';
import Connection from '../models/Connection.js';
import storageService from '../services/storageService.js';
import { logger } from '../utils/logger.js';

const userController = {
  /**
   * Get current user profile
   */
  async getCurrentUser(req, res) {
    try {
      const user = req.user;
      
      // Get user's connections count
      const connectionCount = await Connection.countDocuments({
        status: 'accepted',
        $or: [
          { requesterId: user._id },
          { recipientId: user._id }
        ]
      });

      // Get pending requests count
      const pendingCount = await Connection.countDocuments({
        recipientId: user._id,
        status: 'pending'
      });

      const userProfile = {
        ...user.getPublicProfile(),
        stats: {
          ...user.stats,
          connectionCount,
          pendingRequests: pendingCount
        }
      };

      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });
    } catch (error) {
      logger.error('Failed to get current user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        error: error.message
      });
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const updates = req.body;

      // Build update object
      const updateFields = {};
      
      if (updates.displayName) {
        updateFields['profile.displayName'] = updates.displayName;
      }
      
      if (updates.bio !== undefined) {
        updateFields['profile.bio'] = updates.bio;
      }
      
      if (updates.privateContact !== undefined) {
        updateFields['profile.privateContact'] = updates.privateContact;
      }

      if (updates.settings) {
        if (updates.settings.autoAcceptConnections !== undefined) {
          updateFields['settings.autoAcceptConnections'] = updates.settings.autoAcceptConnections;
        }
        if (updates.settings.contactRevealPolicy !== undefined) {
          updateFields['settings.contactRevealPolicy'] = updates.settings.contactRevealPolicy;
        }
        if (updates.settings.notifications !== undefined) {
          Object.keys(updates.settings.notifications).forEach(key => {
            updateFields[`settings.notifications.${key}`] = updates.settings.notifications[key];
          });
        }
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        updateFields,
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('User profile updated:', { userId, updates });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?._id;

      const user = await User.findById(userId);
      
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if users are connected
      let isConnected = false;
      let connectionStatus = null;
      
      if (currentUserId && !currentUserId.equals(userId)) {
        const connection = await Connection.findOne({
          $or: [
            { requesterId: currentUserId, recipientId: userId },
            { requesterId: userId, recipientId: currentUserId }
          ]
        });
        
        if (connection) {
          isConnected = connection.status === 'accepted';
          connectionStatus = connection.status;
        }
      }

      // Get user's stats
      const stats = {
        ...user.stats,
        connectionCount: await Connection.countDocuments({
          status: 'accepted',
          $or: [
            { requesterId: userId },
            { recipientId: userId }
          ]
        })
      };

      const userProfile = {
        ...user.getPublicProfile(),
        stats,
        connection: {
          isConnected,
          status: connectionStatus
        }
      };

      // If users are connected and contact is revealed, include private contact
      if (isConnected && user.profile.contactRevealed) {
        userProfile.profile.privateContact = user.profile.privateContact;
      }

      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        error: error.message
      });
    }
  },

  /**
   * Search users
   */
  async searchUsers(req, res) {
    try {
      const { q: query, limit = 20, skip = 0 } = req.query;
      const currentUserId = req.user._id;

      // Search users by username, display name, or email
      const users = await User.find({
        $and: [
          {
            $or: [
              { username: { $regex: query, $options: 'i' } },
              { 'profile.displayName': { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } }
            ]
          },
          { isActive: true },
          { _id: { $ne: currentUserId } } // Exclude current user
        ]
      })
      .select('username profile.displayName profile.avatar profile.bio stats')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ 'stats.connectionCount': -1 });

      // Get connection status for each user
      const usersWithConnectionStatus = await Promise.all(
        users.map(async (user) => {
          const connection = await Connection.findOne({
            $or: [
              { requesterId: currentUserId, recipientId: user._id },
              { requesterId: user._id, recipientId: currentUserId }
            ]
          });

          return {
            ...user.toObject(),
            connection: connection ? {
              isConnected: connection.status === 'accepted',
              status: connection.status
            } : {
              isConnected: false,
              status: null
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          users: usersWithConnectionStatus,
          query,
          total: usersWithConnectionStatus.length
        }
      });
    } catch (error) {
      logger.error('User search failed:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: error.message
      });
    }
  },

  /**
   * Get user's connections
   */
  async getUserConnections(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const connections = await Connection.find({
        status: 'accepted',
        $or: [
          { requesterId: userId },
          { recipientId: userId }
        ]
      })
      .populate('requesterId recipientId', 'username profile.displayName profile.avatar profile.bio')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ acceptedAt: -1 });

      // Format connections
      const formattedConnections = connections.map(connection => {
        const otherUser = connection.requesterId._id.equals(userId) 
          ? connection.recipientId 
          : connection.requesterId;

        return {
          ...otherUser.toObject(),
          connection: {
            id: connection._id,
            connectedSince: connection.acceptedAt,
            requesterId: connection.requesterId._id
          }
        };
      });

      res.json({
        success: true,
        data: {
          connections: formattedConnections,
          total: formattedConnections.length
        }
      });
    } catch (error) {
      logger.error('Failed to get user connections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get connections',
        error: error.message
      });
    }
  },

  /**
   * Get user stats
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user._id;

      // Get user's stats from database
      const user = await User.findById(userId).select('stats');
      
      // Get additional stats
      const connectionCount = await Connection.countDocuments({
        status: 'accepted',
        $or: [
          { requesterId: userId },
          { recipientId: userId }
        ]
      });

      const pendingRequests = await Connection.countDocuments({
        recipientId: userId,
        status: 'pending'
      });

      const stats = {
        ...user.stats,
        connectionCount,
        pendingRequests
      };

      res.json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user stats',
        error: error.message
      });
    }
  },

  /**
   * Get storage information
   */
  async getStorageInfo(req, res) {
    try {
      const user = req.user;
      const { storagePreference, googleDriveToken } = user.storage;

      if (!googleDriveToken) {
        return res.json({
          success: true,
          data: {
            storage: {
              preference: storagePreference,
              connected: false,
              quota: null
            }
          }
        });
      }

      try {
        const quota = await storageService.getStorageQuota(storagePreference, googleDriveToken);
        
        res.json({
          success: true,
          data: {
            storage: {
              preference: storagePreference,
              connected: true,
              quota: {
                used: parseInt(quota.usage) || 0,
                total: parseInt(quota.limit) || 0,
                available: parseInt(quota.limit) - parseInt(quota.usage) || 0
              }
            }
          }
        });
      } catch (storageError) {
        logger.warn('Failed to get storage quota:', storageError);
        
        res.json({
          success: true,
          data: {
            storage: {
              preference: storagePreference,
              connected: true,
              quota: null,
              error: 'Failed to get storage information'
            }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to get storage info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get storage information',
        error: error.message
      });
    }
  },

  /**
   * Update storage preference
   */
  async updateStoragePreference(req, res) {
    try {
      const { preference } = req.body;
      const userId = req.user._id;

      if (!['google_drive'].includes(preference)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid storage preference'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { 'storage.preference': preference },
        { new: true }
      );

      logger.info('Storage preference updated:', { userId, preference });

      res.json({
        success: true,
        message: 'Storage preference updated',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      logger.error('Failed to update storage preference:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update storage preference',
        error: error.message
      });
    }
  },

  /**
   * Upload avatar (placeholder)
   */
  async uploadAvatar(req, res) {
    try {
      // Placeholder for avatar upload functionality
      // In a real implementation, this would handle image upload and storage
      
      res.json({
        success: true,
        message: 'Avatar upload not implemented yet',
        data: {
          avatarUrl: null
        }
      });
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: error.message
      });
    }
  },

  /**
   * Delete avatar
   */
  async deleteAvatar(req, res) {
    try {
      const userId = req.user._id;

      const user = await User.findByIdAndUpdate(
        userId,
        { $unset: { 'profile.avatar': '' } },
        { new: true }
      );

      logger.info('Avatar deleted:', { userId });

      res.json({
        success: true,
        message: 'Avatar deleted successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      logger.error('Failed to delete avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete avatar',
        error: error.message
      });
    }
  }
};

export default userController;