import User from '../models/User.js';
import Connection from '../models/Connection.js';
import ContactReveal from '../models/ContactReveal.js';
import notificationService from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

const contactController = {
  /**
   * Request contact reveal
   */
  async requestContactReveal(req, res) {
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

      // Check if trying to request contact from self
      if (requesterId.equals(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot request contact reveal from yourself',
        });
      }

      // Check if users are connected
      const connection = await Connection.findOne({
        status: 'accepted',
        $or: [
          { requesterId, recipientId: userId },
          { requesterId: userId, recipientId: requesterId },
        ],
      });

      if (!connection) {
        return res.status(400).json({
          success: false,
          message:
            'You must be connected with this user to request contact reveal',
        });
      }

      // Check if contact is already revealed
      const isRevealed = await ContactReveal.isContactRevealed(
        requesterId,
        userId
      );
      if (isRevealed) {
        return res.status(400).json({
          success: false,
          message:
            'Contact information is already revealed between you and this user',
        });
      }

      // Check if there's already a pending request
      const existingRequest = await ContactReveal.findPendingRequest(
        requesterId,
        userId
      );
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Contact reveal request already pending',
        });
      }

      // Create contact reveal request
      const contactReveal = new ContactReveal({
        requesterId,
        recipientId: userId,
        message,
      });

      await contactReveal.save();

      // Send notification to recipient
      await notificationService.sendNotification(
        userId,
        'contact_reveal_request',
        {
          requesterId,
          requesterName: req.user.username,
          message,
        }
      );

      logger.info('Contact reveal request sent:', {
        requesterId,
        recipientId: userId,
        contactRevealId: contactReveal._id,
      });

      res.status(201).json({
        success: true,
        message: 'Contact reveal request sent',
        data: {
          contactReveal,
        },
      });
    } catch (error) {
      logger.error('Failed to request contact reveal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request contact reveal',
        error: error.message,
      });
    }
  },

  /**
   * Respond to contact reveal request
   */
  async respondToContactRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      const userId = req.user._id;

      // Find contact reveal request
      const contactReveal = await ContactReveal.findById(requestId);

      if (!contactReveal) {
        return res.status(404).json({
          success: false,
          message: 'Contact reveal request not found',
        });
      }

      // Check if user can respond to this request
      if (!contactReveal.canRespond(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You cannot respond to this contact reveal request',
        });
      }

      const oldStatus = contactReveal.status;

      if (status === 'accepted') {
        await contactReveal.accept();

        // Send notification to requester
        const recipient = await User.findById(userId);
        await notificationService.sendNotification(
          contactReveal.requesterId,
          'contact_reveal_accepted',
          {
            accepterId: userId,
            accepterName: recipient.username,
          }
        );

        logger.info('Contact reveal request accepted:', {
          contactRevealId: requestId,
          requesterId: contactReveal.requesterId,
          recipientId: userId,
        });
      } else {
        await contactReveal.reject();

        logger.info('Contact reveal request rejected:', {
          contactRevealId: requestId,
          requesterId: contactReveal.requesterId,
          recipientId: userId,
        });
      }

      res.json({
        success: true,
        message: `Contact reveal request ${status}`,
        data: {
          contactReveal,
          oldStatus,
          newStatus: status,
        },
      });
    } catch (error) {
      logger.error('Failed to respond to contact reveal request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to contact reveal request',
        error: error.message,
      });
    }
  },

  /**
   * Get contact reveal requests
   */
  async getContactRequests(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const requests = await ContactReveal.findPendingRequests(userId)
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
      logger.error('Failed to get contact requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get contact requests',
        error: error.message,
      });
    }
  },

  /**
   * Get revealed contacts
   */
  async getRevealedContacts(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const contacts = await ContactReveal.findAcceptedContacts(userId)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ respondedAt: -1 });

      // Format contacts to include the other user's info and contact details
      const formattedContacts = contacts.map((contact) => {
        const otherUser = contact.requesterId._id.equals(userId)
          ? contact.recipientId
          : contact.requesterId;

        return {
          ...otherUser.toObject(),
          contact: {
            id: contact._id,
            revealedSince: contact.respondedAt,
            requesterId: contact.requesterId._id,
            privateContact: otherUser.profile.privateContact,
          },
        };
      });

      res.json({
        success: true,
        data: {
          contacts: formattedContacts,
          total: formattedContacts.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get revealed contacts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get revealed contacts',
        error: error.message,
      });
    }
  },

  /**
   * Get sent contact reveal requests
   */
  async getSentContactRequests(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const requests = await ContactReveal.findSentRequests(userId)
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
      logger.error('Failed to get sent contact requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sent contact requests',
        error: error.message,
      });
    }
  },

  /**
   * Cancel contact reveal request
   */
  async cancelContactRequest(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const contactReveal = await ContactReveal.findById(requestId);

      if (!contactReveal) {
        return res.status(404).json({
          success: false,
          message: 'Contact reveal request not found',
        });
      }

      // Check if user is the requester and request is pending
      if (
        !contactReveal.requesterId.equals(userId) ||
        contactReveal.status !== 'pending'
      ) {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your own pending requests',
        });
      }

      await ContactReveal.findByIdAndDelete(requestId);

      logger.info('Contact reveal request cancelled:', {
        contactRevealId: requestId,
        requesterId: userId,
      });

      res.json({
        success: true,
        message: 'Contact reveal request cancelled successfully',
      });
    } catch (error) {
      logger.error('Failed to cancel contact reveal request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel contact reveal request',
        error: error.message,
      });
    }
  },

  /**
   * Get contact status between users
   */
  async getContactStatus(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      // Check if users are connected
      const connection = await Connection.findOne({
        status: 'accepted',
        $or: [
          { requesterId: currentUserId, recipientId: userId },
          { requesterId: userId, recipientId: currentUserId },
        ],
      });

      if (!connection) {
        return res.json({
          success: true,
          data: {
            isConnected: false,
            isContactRevealed: false,
            hasPendingRequest: false,
          },
        });
      }

      // Check if contact is revealed
      const contactReveal = await ContactReveal.isContactRevealed(
        currentUserId,
        userId
      );

      // Check if there's a pending contact reveal request
      const pendingRequest = await ContactReveal.findOne({
        status: 'pending',
        $or: [
          { requesterId: currentUserId, recipientId: userId },
          { requesterId: userId, recipientId: currentUserId },
        ],
      });

      res.json({
        success: true,
        data: {
          isConnected: true,
          isContactRevealed: !!contactReveal,
          hasPendingRequest: !!pendingRequest,
          pendingRequestStatus: pendingRequest
            ? {
                id: pendingRequest._id,
                status: pendingRequest.status,
                isRequester: pendingRequest.requesterId.equals(currentUserId),
                createdAt: pendingRequest.createdAt,
              }
            : null,
        },
      });
    } catch (error) {
      logger.error('Failed to get contact status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get contact status',
        error: error.message,
      });
    }
  },
};

export default contactController;
