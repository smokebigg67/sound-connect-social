import User from '../models/User.js';
import Connection from '../models/Connection.js';
import notificationService from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

const connectionController = {
  /**
   * Get pending connection requests
   */
  async getPendingRequests(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const requests = await Connection.findPendingRequests(userId)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          requests,
          total: requests.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get pending requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending requests',
        error: error.message,
      });
    }
  },

  /**
   * Send connection request
   */
  async sendConnectionRequest(req, res) {
    try {
      const { userId } = req.params;
      const { message } = req.body;
      const requesterId = req.user._id;

      // Check if user exists
      const recipient = await User.findById(userId);
      if (!recipient || !recipient.isActive) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if trying to connect to self
      if (requesterId.equals(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot connect with yourself',
        });
      }

      // Check if connection already exists
      const existingConnection = await Connection.findOne({
        $or: [
          { requesterId, recipientId: userId },
          { requesterId: userId, recipientId: requesterId },
        ],
      });

      if (existingConnection) {
        return res.status(400).json({
          success: false,
          message: `Connection already ${existingConnection.status}`,
        });
      }

      // Create connection request
      const connection = new Connection({
        requesterId,
        recipientId: userId,
        message,
      });

      await connection.save();

      // Check if recipient auto-accepts connections
      if (recipient.settings.autoAcceptConnections) {
        connection.status = 'accepted';
        connection.acceptedAt = new Date();
        await connection.save();

        // Update user stats
        await User.findByIdAndUpdate(requesterId, {
          $inc: { 'stats.connectionCount': 1 },
        });
        await User.findByIdAndUpdate(userId, {
          $inc: { 'stats.connectionCount': 1 },
        });

        // Send notification to requester
        await notificationService.sendNotification(
          requesterId,
          'connection_accepted',
          {
            accepterId: userId,
            accepterName: recipient.username,
          }
        );

        logger.info('Connection auto-accepted:', {
          requesterId,
          recipientId: userId,
          connectionId: connection._id,
        });

        return res.json({
          success: true,
          message: 'Connection request accepted automatically',
          data: {
            connection,
            status: 'accepted',
          },
        });
      }

      // Send notification to recipient
      await notificationService.sendNotification(userId, 'connection_request', {
        requesterId,
        requesterName: req.user.username,
        message,
      });

      logger.info('Connection request sent:', {
        requesterId,
        recipientId: userId,
        connectionId: connection._id,
      });

      res.status(201).json({
        success: true,
        message: 'Connection request sent',
        data: {
          connection,
          status: 'pending',
        },
      });
    } catch (error) {
      logger.error('Failed to send connection request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send connection request',
        error: error.message,
      });
    }
  },

  /**
   * Respond to connection request
   */
  async respondToRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      const userId = req.user._id;

      // Find connection request
      const connection = await Connection.findById(requestId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Connection request not found',
        });
      }

      // Check if user can respond to this request
      if (!connection.canRespond(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You cannot respond to this connection request',
        });
      }

      const oldStatus = connection.status;
      connection.status = status;
      connection.respondedAt = new Date();

      if (status === 'accepted') {
        connection.acceptedAt = new Date();

        // Update user stats
        await User.findByIdAndUpdate(connection.requesterId, {
          $inc: { 'stats.connectionCount': 1 },
        });
        await User.findByIdAndUpdate(userId, {
          $inc: { 'stats.connectionCount': 1 },
        });

        // Send notification to requester
        const recipient = await User.findById(userId);
        await notificationService.sendNotification(
          connection.requesterId,
          'connection_accepted',
          {
            accepterId: userId,
            accepterName: recipient.username,
          }
        );

        logger.info('Connection request accepted:', {
          connectionId: requestId,
          requesterId: connection.requesterId,
          recipientId: userId,
        });
      } else {
        logger.info('Connection request rejected:', {
          connectionId: requestId,
          requesterId: connection.requesterId,
          recipientId: userId,
        });
      }

      await connection.save();

      res.json({
        success: true,
        message: `Connection request ${status}`,
        data: {
          connection,
          oldStatus,
          newStatus: status,
        },
      });
    } catch (error) {
      logger.error('Failed to respond to connection request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to connection request',
        error: error.message,
      });
    }
  },

  /**
   * Remove connection
   */
  async removeConnection(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      // Find connection
      const connection = await Connection.findOne({
        status: 'accepted',
        $or: [
          { requesterId: currentUserId, recipientId: userId },
          { requesterId: userId, recipientId: currentUserId },
        ],
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Connection not found',
        });
      }

      // Remove connection
      await Connection.findByIdAndDelete(connection._id);

      // Update user stats
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { 'stats.connectionCount': -1 },
      });
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.connectionCount': -1 },
      });

      logger.info('Connection removed:', {
        connectionId: connection._id,
        userId1: currentUserId,
        userId2: userId,
      });

      res.json({
        success: true,
        message: 'Connection removed successfully',
      });
    } catch (error) {
      logger.error('Failed to remove connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove connection',
        error: error.message,
      });
    }
  },

  /**
   * Get connection suggestions
   */
  async getConnectionSuggestions(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 10, skip = 0 } = req.query;

      // Get user's connections
      const userConnections = await Connection.find({
        status: 'accepted',
        $or: [{ requesterId: userId }, { recipientId: userId }],
      }).select('requesterId recipientId');

      const connectedUserIds = new Set();
      userConnections.forEach((conn) => {
        connectedUserIds.add(conn.requesterId.toString());
        connectedUserIds.add(conn.recipientId.toString());
      });

      // Get users that are not connected and not the current user
      const suggestions = await User.find({
        _id: { $ne: userId, $nin: Array.from(connectedUserIds) },
        isActive: true,
      })
        .select('username profile.displayName profile.avatar profile.bio stats')
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ 'stats.connectionCount': -1, 'stats.postCount': -1 });

      res.json({
        success: true,
        data: {
          suggestions,
          total: suggestions.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get connection suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get connection suggestions',
        error: error.message,
      });
    }
  },

  /**
   * Get user's connections (alias for getUserConnections)
   */
  async getUserConnections(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const connections = await Connection.findAcceptedConnections(userId)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ acceptedAt: -1 });

      // Format connections
      const formattedConnections = connections.map((connection) => {
        const otherUser = connection.requesterId._id.equals(userId)
          ? connection.recipientId
          : connection.requesterId;

        return {
          ...otherUser.toObject(),
          connection: {
            id: connection._id,
            connectedSince: connection.acceptedAt,
            requesterId: connection.requesterId._id,
          },
        };
      });

      res.json({
        success: true,
        data: {
          connections: formattedConnections,
          total: formattedConnections.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get user connections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get connections',
        error: error.message,
      });
    }
  },

  /**
   * Get sent connection requests
   */
  async getSentRequests(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const requests = await Connection.findSentRequests(userId)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          requests,
          total: requests.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get sent requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sent requests',
        error: error.message,
      });
    }
  },

  /**
   * Get blocked users
   */
  async getBlockedUsers(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const blockedConnections = await Connection.find({
        $or: [
          { requesterId: userId, status: 'blocked' },
          { recipientId: userId, status: 'blocked' },
        ],
      })
        .populate(
          'requesterId recipientId',
          'username profile.displayName profile.avatar'
        )
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ updatedAt: -1 });

      const blockedUsers = blockedConnections.map((connection) => {
        const blockedUser = connection.requesterId._id.equals(userId)
          ? connection.recipientId
          : connection.requesterId;

        return {
          ...blockedUser.toObject(),
          blockedSince: connection.updatedAt,
          blockedBy: connection.requesterId._id.equals(userId) ? 'me' : 'them',
        };
      });

      res.json({
        success: true,
        data: {
          blockedUsers,
          total: blockedUsers.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get blocked users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get blocked users',
        error: error.message,
      });
    }
  },

  /**
   * Block user
   */
  async blockUser(req, res) {
    try {
      const { userId } = req.params;
      const blockerId = req.user._id;

      // Check if user exists
      const userToBlock = await User.findById(userId);
      if (!userToBlock || !userToBlock.isActive) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Find or create connection
      let connection = await Connection.findOne({
        $or: [
          { requesterId: blockerId, recipientId: userId },
          { requesterId: userId, recipientId: blockerId },
        ],
      });

      if (connection) {
        connection.status = 'blocked';
        connection.respondedAt = new Date();
      } else {
        connection = new Connection({
          requesterId: blockerId,
          recipientId: userId,
          status: 'blocked',
        });
      }

      await connection.save();

      logger.info('User blocked:', {
        blockerId,
        blockedUserId: userId,
        connectionId: connection._id,
      });

      res.json({
        success: true,
        message: 'User blocked successfully',
      });
    } catch (error) {
      logger.error('Failed to block user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to block user',
        error: error.message,
      });
    }
  },

  /**
   * Unblock user
   */
  async unblockUser(req, res) {
    try {
      const { userId } = req.params;
      const unblockerId = req.user._id;

      const connection = await Connection.findOne({
        $or: [
          { requesterId: unblockerId, recipientId: userId, status: 'blocked' },
          { requesterId: userId, recipientId: unblockerId, status: 'blocked' },
        ],
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Blocked user not found',
        });
      }

      // Remove the connection
      await Connection.findByIdAndDelete(connection._id);

      logger.info('User unblocked:', {
        unblockerId,
        unblockedUserId: userId,
        connectionId: connection._id,
      });

      res.json({
        success: true,
        message: 'User unblocked successfully',
      });
    } catch (error) {
      logger.error('Failed to unblock user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unblock user',
        error: error.message,
      });
    }
  },
};

export default connectionController;
