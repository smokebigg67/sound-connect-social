const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.isProcessing = false;
  }

  /**
   * Send notification to user
   * @param {string} userId - User ID to notify
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async sendNotification(userId, type, data, options = {}) {
    try {
      const notification = {
        userId,
        type,
        data,
        options,
        createdAt: new Date(),
        status: 'pending',
      };

      // Add to queue
      this.notificationQueue.push(notification);

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      logger.info('Notification queued:', {
        userId,
        type,
        data: JSON.stringify(data),
      });
    } catch (error) {
      logger.error('Failed to queue notification:', {
        userId,
        type,
        error: error.message,
      });
    }
  }

  /**
   * Process notification queue
   */
  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.processNotification(notification);
      }
    } catch (error) {
      logger.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual notification
   * @param {Object} notification - Notification object
   */
  async processNotification(notification) {
    try {
      const { userId, type, data, options } = notification;

      // Check if user wants this type of notification
      const userPreferences = await this.getUserNotificationPreferences(userId);
      if (!this.shouldSendNotification(type, userPreferences)) {
        logger.info('Notification skipped due to user preferences:', {
          userId,
          type,
        });
        return;
      }

      // Send notification based on type
      switch (type) {
        case 'connection_request':
          await this.sendConnectionRequestNotification(userId, data);
          break;
        case 'connection_accepted':
          await this.sendConnectionAcceptedNotification(userId, data);
          break;
        case 'contact_reveal_request':
          await this.sendContactRevealRequestNotification(userId, data);
          break;
        case 'contact_reveal_accepted':
          await this.sendContactRevealAcceptedNotification(userId, data);
          break;
        case 'new_post':
          await this.sendNewPostNotification(userId, data);
          break;
        case 'post_comment':
          await this.sendPostCommentNotification(userId, data);
          break;
        case 'post_like':
          await this.sendPostLikeNotification(userId, data);
          break;
        default:
          logger.warn('Unknown notification type:', { type });
      }

      notification.status = 'sent';
      notification.sentAt = new Date();

      logger.info('Notification sent successfully:', {
        userId,
        type,
        notificationId: notification._id,
      });
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;

      logger.error('Failed to send notification:', {
        userId: notification.userId,
        type: notification.type,
        error: error.message,
      });
    }
  }

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserNotificationPreferences(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId).select('settings.notifications');

      if (!user) {
        throw new Error('User not found');
      }

      return user.settings.notifications || {};
    } catch (error) {
      logger.error('Failed to get user notification preferences:', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Check if notification should be sent based on preferences
   * @param {string} type - Notification type
   * @param {Object} preferences - User preferences
   * @returns {boolean} True if should send
   */
  shouldSendNotification(type, preferences) {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return preferences.newConnection !== false;
      case 'contact_reveal_request':
      case 'contact_reveal_accepted':
        return preferences.contactRequest !== false;
      case 'new_post':
        return preferences.newPost !== false;
      case 'post_comment':
      case 'post_like':
        return preferences.newPost !== false; // Use newPost preference for engagement
      default:
        return true;
    }
  }

  /**
   * Send connection request notification
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   */
  async sendConnectionRequestNotification(userId, data) {
    const { requesterId, message } = data;

    const notification = {
      title: 'New Connection Request',
      message: message
        ? `${data.requesterName} sent you a connection request: "${message}"`
        : `${data.requesterName} sent you a connection request`,
      type: 'connection_request',
      data: {
        requesterId,
        message,
      },
    };

    await this.deliverNotification(userId, notification);
  }

  /**
   * Send connection accepted notification
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   */
  async sendConnectionAcceptedNotification(userId, data) {
    const { accepterId } = data;

    const notification = {
      title: 'Connection Accepted',
      message: `${data.accepterName} accepted your connection request`,
      type: 'connection_accepted',
      data: {
        accepterId,
      },
    };

    await this.deliverNotification(userId, notification);
  }

  /**
   * Send contact reveal request notification
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   */
  async sendContactRevealRequestNotification(userId, data) {
    const { requesterId, message } = data;

    const notification = {
      title: 'Contact Reveal Request',
      message: message
        ? `${data.requesterName} wants to reveal contact information: "${message}"`
        : `${data.requesterName} wants to reveal contact information`,
      type: 'contact_reveal_request',
      data: {
        requesterId,
        message,
      },
    };

    await this.deliverNotification(userId, notification);
  }

  /**
   * Send contact reveal accepted notification
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   */
  async sendContactRevealAcceptedNotification(userId, data) {
    const { accepterId } = data;

    const notification = {
      title: 'Contact Information Revealed',
      message: `${data.accepterName} shared their contact information with you`,
      type: 'contact_reveal_accepted',
      data: {
        accepterId,
      },
    };

    await this.deliverNotification(userId, notification);
  }

  /**
   * Send new post notification
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   */
  async sendNewPostNotification(userId, data) {
    const { authorId, postTitle } = data;

    const notification = {
      title: 'New Audio Post',
      message: postTitle
        ? `${data.authorName} posted: "${postTitle}"`
        : `${data.authorName} shared a new audio post`,
      type: 'new_post',
      data: {
        authorId,
        postId: data.postId,
      },
    };

    await this.deliverNotification(userId, notification);
  }

  /**
   * Send post comment notification
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   */
  async sendPostCommentNotification(userId, data) {
    const { commenterId, postTitle } = data;

    const notification = {
      title: 'New Comment on Your Post',
      message: postTitle
        ? `${data.commenterName} commented on: "${postTitle}"`
        : `${data.commenterName} commented on your post`,
      type: 'post_comment',
      data: {
        commenterId,
        postId: data.postId,
        commentId: data.commentId,
      },
    };

    await this.deliverNotification(userId, notification);
  }

  /**
   * Send post like notification
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   */
  async sendPostLikeNotification(userId, data) {
    const { likerId, postTitle } = data;

    const notification = {
      title: 'New Like on Your Post',
      message: postTitle
        ? `${data.likerName} liked your post: "${postTitle}"`
        : `${data.likerName} liked your post`,
      type: 'post_like',
      data: {
        likerId,
        postId: data.postId,
      },
    };

    await this.deliverNotification(userId, notification);
  }

  /**
   * Deliver notification to user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   */
  async deliverNotification(userId, notification) {
    // This is a placeholder for actual notification delivery
    // In a real implementation, this would:
    // 1. Save notification to database
    // 2. Send push notification if user has device tokens
    // 3. Send email if user has email notifications enabled
    // 4. Send WebSocket message if user is online

    logger.info('Delivering notification:', {
      userId,
      notification: JSON.stringify(notification),
    });

    // For now, just log the notification
    // In production, implement actual delivery mechanisms
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of notifications
   */
  async getUserNotifications(userId, options = {}) {
    // This would typically query a notifications collection
    // For now, return empty array
    return [];
  }

  /**
   * Mark notification as read
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async markAsRead(userId, notificationId) {
    // This would typically update the notification in database
    logger.info('Marking notification as read:', { userId, notificationId });
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllAsRead(userId) {
    // This would typically update all notifications for user in database
    logger.info('Marking all notifications as read:', { userId });
  }
}

module.exports = new NotificationService();
