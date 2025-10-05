import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
        min: [1, 'Audio must be at least 1 second'],
        max: [600, 'Audio cannot exceed 10 minutes'],
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
      title: {
        type: String,
        maxlength: [200, 'Title cannot exceed 200 characters'],
      },
      tags: [
        {
          type: String,
          trim: true,
          maxlength: [30, 'Tags cannot exceed 30 characters'],
        },
      ],
      language: {
        type: String,
        default: 'en',
      },
    },
    privacy: {
      type: String,
      enum: ['public', 'connections_only', 'private'],
      default: 'public',
    },
    engagement: {
      likeCount: { type: Number, default: 0 },
      commentCount: { type: Number, default: 0 },
      shareCount: { type: Number, default: 0 },
      listenCount: { type: Number, default: 0 },
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
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'content.tags': 1 });
postSchema.index({ privacy: 1, createdAt: -1 });
postSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for total engagement score
postSchema.virtual('engagementScore').get(function () {
  return (
    this.engagement.likeCount * 2 +
    this.engagement.commentCount * 3 +
    this.engagement.shareCount * 5 +
    this.engagement.listenCount
  );
});

// Method to increment listen count
postSchema.methods.incrementListenCount = function () {
  this.engagement.listenCount += 1;
  return this.save();
};

// Method to toggle like
postSchema.methods.toggleLike = function (userId) {
  const userIndex = this.likedBy.indexOf(userId);

  if (userIndex === -1) {
    // User hasn't liked this post yet
    this.likedBy.push(userId);
    this.engagement.likeCount += 1;
  } else {
    // User has already liked this post
    this.likedBy.splice(userIndex, 1);
    this.engagement.likeCount -= 1;
  }

  return this.save();
};

// Method to check if user has liked the post
postSchema.methods.isLikedBy = function (userId) {
  return this.likedBy.includes(userId);
};

// Method to check if user can view the post
postSchema.methods.canView = function (userId) {
  if (this.privacy === 'public') return true;
  if (this.privacy === 'private') return this.authorId.equals(userId);

  // For connections_only, check if users are connected
  if (this.privacy === 'connections_only') {
    if (this.authorId.equals(userId)) return true;
    // This would need to check connection status - implemented in controller
    return true; // Placeholder, actual check in controller
  }

  return false;
};

// Static method to find public posts
postSchema.statics.findPublicPosts = function (limit = 20, skip = 0) {
  return this.find({
    privacy: 'public',
    isActive: true,
  })
    .populate('authorId', 'username profile.displayName profile.avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find posts by user
postSchema.statics.findByUser = function (
  userId,
  viewerId = null,
  limit = 20,
  skip = 0
) {
  const query = {
    authorId: userId,
    isActive: true,
  };

  // If viewer is not the author, only show public posts
  if (viewerId && !userId.equals(viewerId)) {
    query.privacy = 'public';
  }

  return this.find(query)
    .populate('authorId', 'username profile.displayName profile.avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware to validate tags
postSchema.pre('save', function (next) {
  if (this.content.tags && this.content.tags.length > 10) {
    this.content.tags = this.content.tags.slice(0, 10); // Limit to 10 tags
  }
  next();
});

export default mongoose.model('Post', postSchema);
