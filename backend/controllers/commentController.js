import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Connection from '../models/Connection.js';
import audioService from '../services/audioService.js';
import notificationService from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

const commentController = {
  /**
   * Get comments for a post
   */
  async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const { limit = 20, skip = 0 } = req.query;

      const post = await Post.findById(postId);
      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      const comments = await Comment.findTopLevelComments(
        postId,
        parseInt(limit),
        parseInt(skip)
      );

      res.json({
        success: true,
        data: {
          comments,
          total: comments.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get post comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comments',
        error: error.message,
      });
    }
  },

  /**
   * Create comment on post
   */
  async createComment(req, res) {
    try {
      const { postId } = req.params;
      const { parentCommentId } = req.body;
      const userId = req.user._id;
      const audioFile = req.file;
      const audioMetadata = req.audioMetadata;

      if (!audioFile || !audioMetadata) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required',
        });
      }

      const post = await Post.findById(postId);
      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Process audio file
      const audioData = await audioService.processAudio(
        { ...audioFile, ...audioMetadata },
        userId,
        'google_drive',
        req.user.storage.googleDriveToken
      );

      // Create comment
      const comment = new Comment({
        postId,
        authorId: userId,
        parentCommentId,
        audio: audioData,
      });

      await comment.save();

      // Send notification to post author (if not commenting on own post)
      if (!post.authorId.equals(userId)) {
        await notificationService.sendNotification(
          post.authorId,
          'post_comment',
          {
            commenterId: userId,
            commenterName: req.user.username,
            postTitle: post.content.title,
            postId: post._id,
            commentId: comment._id,
          }
        );
      }

      // Send notification to parent comment author (if replying to someone else's comment)
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (parentComment && !parentComment.authorId.equals(userId)) {
          await notificationService.sendNotification(
            parentComment.authorId,
            'post_comment',
            {
              commenterId: userId,
              commenterName: req.user.username,
              postTitle: post.content.title,
              postId: post._id,
              commentId: comment._id,
            }
          );
        }
      }

      logger.info('Comment created successfully:', {
        commentId: comment._id,
        postId,
        userId,
        duration: audioData.duration,
      });

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: {
          comment,
        },
      });
    } catch (error) {
      logger.error('Failed to create comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: error.message,
      });
    }
  },

  /**
   * Delete comment
   */
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;

      const comment = await Comment.findById(commentId);

      if (!comment || !comment.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      // Check if user is the author
      if (!comment.authorId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own comments',
        });
      }

      // Delete audio file from storage
      await audioService.deleteAudio(
        comment.audio,
        userId,
        req.user.storage.googleDriveToken
      );

      // Soft delete the comment
      comment.isActive = false;
      await comment.save();

      logger.info('Comment deleted successfully:', { commentId, userId });

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: error.message,
      });
    }
  },

  /**
   * Get comment replies
   */
  async getCommentReplies(req, res) {
    try {
      const { commentId } = req.params;
      const { limit = 20, skip = 0 } = req.query;

      const parentComment = await Comment.findById(commentId);
      if (!parentComment || !parentComment.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      const replies = await Comment.find({
        parentCommentId: commentId,
        isActive: true,
      })
        .populate('authorId', 'username profile.displayName profile.avatar')
        .sort({ createdAt: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      res.json({
        success: true,
        data: {
          replies,
          total: replies.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get comment replies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comment replies',
        error: error.message,
      });
    }
  },

  /**
   * Toggle like on comment
   */
  async toggleLike(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;

      const comment = await Comment.findById(commentId);

      if (!comment || !comment.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      const wasLiked = comment.isLikedBy(userId);
      await comment.toggleLike(userId);

      // Send notification if comment is being liked (not unliked)
      if (!wasLiked && !comment.authorId.equals(userId)) {
        const post = await Post.findById(comment.postId);
        await notificationService.sendNotification(
          comment.authorId,
          'post_like',
          {
            likerId: userId,
            likerName: req.user.username,
            postTitle: post?.content.title,
            postId: comment.postId,
            commentId: comment._id,
          }
        );
      }

      logger.info('Comment like toggled:', {
        commentId,
        userId,
        action: wasLiked ? 'unliked' : 'liked',
      });

      res.json({
        success: true,
        message: wasLiked ? 'Comment unliked' : 'Comment liked',
        data: {
          liked: !wasLiked,
          likeCount: comment.likeCount,
        },
      });
    } catch (error) {
      logger.error('Failed to toggle comment like:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle like',
        error: error.message,
      });
    }
  },

  /**
   * Get comment likes
   */
  async getCommentLikes(req, res) {
    try {
      const { commentId } = req.params;
      const { limit = 20, skip = 0 } = req.query;

      const comment = await Comment.findById(commentId).populate(
        'likedBy',
        'username profile.displayName profile.avatar'
      );

      if (!comment || !comment.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      const likes = comment.likedBy.slice(
        parseInt(skip),
        parseInt(skip) + parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          likes,
          total: comment.likedBy.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get comment likes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comment likes',
        error: error.message,
      });
    }
  },

  /**
   * Update comment
   */
  async updateComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;
      const { transcription } = req.body;

      const comment = await Comment.findById(commentId);

      if (!comment || !comment.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      // Check if user is the author
      if (!comment.authorId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own comments',
        });
      }

      // Update comment
      if (transcription !== undefined)
        comment.content.transcription = transcription;

      await comment.save();

      logger.info('Comment updated successfully:', { commentId, userId });

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: {
          comment,
        },
      });
    } catch (error) {
      logger.error('Failed to update comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: error.message,
      });
    }
  },

  /**
   * Get user's comments
   */
  async getUserComments(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, skip = 0 } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const comments = await Comment.find({
        authorId: userId,
        isActive: true,
      })
        .populate('postId', 'content.title privacy')
        .populate('authorId', 'username profile.displayName profile.avatar')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      res.json({
        success: true,
        data: {
          comments,
          total: comments.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get user comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user comments',
        error: error.message,
      });
    }
  },
};

export default commentController;
