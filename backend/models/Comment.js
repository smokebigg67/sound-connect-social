import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    audio: {
      storageType: {
        type: String,
        enum: ['google_drive'],
        required: true,
      },
      fileId: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
        max: [120, 'Comments cannot exceed 2 minutes'],
      },
      format: {
        type: String,
        default: 'webm',
      },
      fileSize: {
        type: Number,
        required: true,
      },
    },
    content: {
      transcription: String,
    },
    depth: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ authorId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ depth: 1, createdAt: 1 });
commentSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function () {
  return this.likedBy.length;
});

// Method to toggle like
commentSchema.methods.toggleLike = function (userId) {
  const userIndex = this.likedBy.indexOf(userId);

  if (userIndex === -1) {
    // User hasn't liked this comment yet
    this.likedBy.push(userId);
  } else {
    // User has already liked this comment
    this.likedBy.splice(userIndex, 1);
  }

  return this.save();
};

// Method to check if user has liked the comment
commentSchema.methods.isLikedBy = function (userId) {
  return this.likedBy.includes(userId);
};

// Method to get replies
commentSchema.methods.getReplies = function () {
  return this.model('Comment')
    .find({
      parentCommentId: this._id,
      isActive: true,
    })
    .populate('authorId', 'username profile.displayName profile.avatar');
};

// Pre-save middleware to set depth
commentSchema.pre('save', async function (next) {
  if (this.isNew && this.parentCommentId) {
    try {
      const parentComment = await this.model('Comment').findById(
        this.parentCommentId
      );
      if (parentComment) {
        this.depth = parentComment.depth + 1;

        // Limit nesting depth to 5 levels
        if (this.depth > 5) {
          return next(
            new Error('Comment nesting depth cannot exceed 5 levels')
          );
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to update post comment count
commentSchema.pre('save', async function (next) {
  if (this.isNew && this.isActive) {
    try {
      const Post = mongoose.model('Post');
      await Post.findByIdAndUpdate(this.postId, {
        $inc: { 'engagement.commentCount': 1 },
      });
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-remove middleware to update post comment count
commentSchema.pre('remove', async function (next) {
  if (this.isActive) {
    try {
      const Post = mongoose.model('Post');
      await Post.findByIdAndUpdate(this.postId, {
        $inc: { 'engagement.commentCount': -1 },
      });
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to find top-level comments for a post
commentSchema.statics.findTopLevelComments = function (
  postId,
  limit = 20,
  skip = 0
) {
  return this.find({
    postId,
    parentCommentId: null,
    isActive: true,
  })
    .populate('authorId', 'username profile.displayName profile.avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find comment thread
commentSchema.statics.findCommentThread = function (commentId) {
  return this.find({
    $or: [{ _id: commentId }, { parentCommentId: commentId }],
    isActive: true,
  })
    .populate('authorId', 'username profile.displayName profile.avatar')
    .sort({ createdAt: 1 });
};

export default mongoose.model('Comment', commentSchema);
