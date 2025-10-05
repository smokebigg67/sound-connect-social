import User from '../models/User.js';
import Post from '../models/Post.js';
import Connection from '../models/Connection.js';
import audioService from '../services/audioService.js';
import notificationService from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

const postController = {
  /**
   * Get user's feed
   */
  async getUserFeed(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      // Get user's connections
      const connections = await Connection.find({
        status: 'accepted',
        $or: [{ requesterId: userId }, { recipientId: userId }],
      }).select('requesterId recipientId');

      const connectedUserIds = new Set([userId.toString()]); // Include user's own posts
      connections.forEach((conn) => {
        connectedUserIds.add(conn.requesterId.toString());
        connectedUserIds.add(conn.recipientId.toString());
      });

      // Get posts from connections
      const posts = await Post.find({
        authorId: { $in: Array.from(connectedUserIds) },
        isActive: true,
        privacy: { $in: ['public', 'connections_only'] },
      })
        .populate('authorId', 'username profile.displayName profile.avatar')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      res.json({
        success: true,
        data: {
          posts,
          total: posts.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get user feed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feed',
        error: error.message,
      });
    }
  },

  /**
   * Create new post
   */
  async createPost(req, res) {
    try {
      const userId = req.user._id;
      const { title, tags, privacy } = req.body;
      const audioFile = req.file;
      const audioMetadata = req.audioMetadata;

      if (!audioFile || !audioMetadata) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required',
        });
      }

      // Process audio file
      const audioData = await audioService.processAudio(
        { ...audioFile, ...audioMetadata },
        userId,
        'google_drive',
        req.user.storage.googleDriveToken
      );

      // Create post
      const post = new Post({
        authorId: userId,
        audio: audioData,
        content: {
          title,
          tags: tags || [],
        },
        privacy: privacy || 'public',
      });

      await post.save();

      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'stats.postCount': 1,
          'stats.audioMinutes': Math.floor(audioData.duration / 60),
        },
      });

      // Notify connections about new post
      const connections = await Connection.find({
        status: 'accepted',
        $or: [{ requesterId: userId }, { recipientId: userId }],
      });

      const connectionIds = connections
        .map((conn) =>
          conn.requesterId.equals(userId) ? conn.recipientId : conn.requesterId
        )
        .filter((id) => !id.equals(userId));

      for (const connectionId of connectionIds) {
        await notificationService.sendNotification(connectionId, 'new_post', {
          authorId: userId,
          authorName: req.user.username,
          postTitle: title,
          postId: post._id,
        });
      }

      logger.info('Post created successfully:', {
        postId: post._id,
        userId,
        duration: audioData.duration,
      });

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: {
          post,
        },
      });
    } catch (error) {
      logger.error('Failed to create post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: error.message,
      });
    }
  },

  /**
   * Get post by ID
   */
  async getPost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user?._id;

      const post = await Post.findById(postId).populate(
        'authorId',
        'username profile.displayName profile.avatar profile.bio'
      );

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Check if user can view the post
      if (!post.canView(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this post',
        });
      }

      res.json({
        success: true,
        data: {
          post,
        },
      });
    } catch (error) {
      logger.error('Failed to get post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get post',
        error: error.message,
      });
    }
  },

  /**
   * Delete post
   */
  async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Check if user is the author
      if (!post.authorId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own posts',
        });
      }

      // Delete audio file from storage
      await audioService.deleteAudio(
        post.audio,
        userId,
        req.user.storage.googleDriveToken
      );

      // Soft delete the post
      post.isActive = false;
      await post.save();

      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'stats.postCount': -1,
          'stats.audioMinutes': -Math.floor(post.audio.duration / 60),
        },
      });

      logger.info('Post deleted successfully:', { postId, userId });

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete post',
        error: error.message,
      });
    }
  },

  /**
   * Get user's posts
   */
  async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?._id;
      const { limit = 20, skip = 0 } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const posts = await Post.findByUser(
        userId,
        currentUserId,
        parseInt(limit),
        parseInt(skip)
      );

      res.json({
        success: true,
        data: {
          posts,
          total: posts.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get user posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user posts',
        error: error.message,
      });
    }
  },

  /**
   * Toggle like on post
   */
  async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      const wasLiked = post.isLikedBy(userId);
      await post.toggleLike(userId);

      // Send notification if post is being liked (not unliked)
      if (!wasLiked && !post.authorId.equals(userId)) {
        await notificationService.sendNotification(post.authorId, 'post_like', {
          likerId: userId,
          likerName: req.user.username,
          postTitle: post.content.title,
          postId: post._id,
        });
      }

      logger.info('Post like toggled:', {
        postId,
        userId,
        action: wasLiked ? 'unliked' : 'liked',
      });

      res.json({
        success: true,
        message: wasLiked ? 'Post unliked' : 'Post liked',
        data: {
          liked: !wasLiked,
          likeCount: post.engagement.likeCount,
        },
      });
    } catch (error) {
      logger.error('Failed to toggle post like:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle like',
        error: error.message,
      });
    }
  },

  /**
   * Get post likes
   */
  async getPostLikes(req, res) {
    try {
      const { postId } = req.params;
      const { limit = 20, skip = 0 } = req.query;

      const post = await Post.findById(postId).populate(
        'likedBy',
        'username profile.displayName profile.avatar'
      );

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      const likes = post.likedBy.slice(
        parseInt(skip),
        parseInt(skip) + parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          likes,
          total: post.likedBy.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get post likes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get post likes',
        error: error.message,
      });
    }
  },

  /**
   * Update post
   */
  async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;
      const { title, tags, privacy } = req.body;

      const post = await Post.findById(postId);

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Check if user is the author
      if (!post.authorId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own posts',
        });
      }

      // Update post
      if (title !== undefined) post.content.title = title;
      if (tags !== undefined) post.content.tags = tags;
      if (privacy !== undefined) post.privacy = privacy;

      await post.save();

      logger.info('Post updated successfully:', { postId, userId });

      res.json({
        success: true,
        message: 'Post updated successfully',
        data: {
          post,
        },
      });
    } catch (error) {
      logger.error('Failed to update post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: error.message,
      });
    }
  },

  /**
   * Get trending posts
   */
  async getTrendingPosts(req, res) {
    try {
      const { limit = 20, skip = 0 } = req.query;
      const userId = req.user?._id;

      // Get posts with high engagement
      const posts = await Post.find({
        isActive: true,
        privacy: 'public',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      })
        .populate('authorId', 'username profile.displayName profile.avatar')
        .sort({
          'engagement.likeCount': -1,
          'engagement.commentCount': -1,
          'engagement.listenCount': -1,
        })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      res.json({
        success: true,
        data: {
          posts,
          total: posts.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get trending posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending posts',
        error: error.message,
      });
    }
  },

  /**
   * Get explore posts
   */
  async getExplorePosts(req, res) {
    try {
      const { limit = 20, skip = 0 } = req.query;
      const userId = req.user?._id;

      // Get random public posts for exploration
      const posts = await Post.find({
        isActive: true,
        privacy: 'public',
      })
        .populate('authorId', 'username profile.displayName profile.avatar')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      res.json({
        success: true,
        data: {
          posts,
          total: posts.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get explore posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get explore posts',
        error: error.message,
      });
    }
  },

  /**
   * Record post listen
   */
  async recordListen(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      await post.incrementListenCount();

      logger.info('Post listen recorded:', { postId, userId });

      res.json({
        success: true,
        message: 'Listen recorded successfully',
      });
    } catch (error) {
      logger.error('Failed to record post listen:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record listen',
        error: error.message,
      });
    }
  },

  /**
   * Get post stats
   */
  async getPostStats(req, res) {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId);

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      const stats = {
        engagement: post.engagement,
        engagementScore: post.engagementScore,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      res.json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      logger.error('Failed to get post stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get post stats',
        error: error.message,
      });
    }
  },
};

export default postController;
