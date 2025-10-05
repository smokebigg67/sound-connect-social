import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending',
  },
  message: {
    type: String,
    maxlength: [200, 'Message cannot exceed 200 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: Date,
  respondedAt: Date,
});

// Compound index for unique connections
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
connectionSchema.index({ recipientId: 1, status: 1 });
connectionSchema.index({ requesterId: 1, status: 1 });
connectionSchema.index({ status: 1, createdAt: -1 });

// Prevent self-connections
connectionSchema.pre('save', function (next) {
  if (this.requesterId.equals(this.recipientId)) {
    return next(new Error('Cannot connect with yourself'));
  }
  next();
});

// Pre-save middleware to update timestamps based on status
connectionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'accepted') {
    this.acceptedAt = new Date();
    this.respondedAt = new Date();
  } else if (
    this.isModified('status') &&
    ['rejected', 'blocked'].includes(this.status)
  ) {
    this.respondedAt = new Date();
  }
  next();
});

// Method to check if connection is active
connectionSchema.methods.isActive = function () {
  return this.status === 'accepted';
};

// Method to check if user can respond to request
connectionSchema.methods.canRespond = function (userId) {
  return this.status === 'pending' && this.recipientId.equals(userId);
};

// Static method to find pending requests for a user
connectionSchema.statics.findPendingRequests = function (userId) {
  return this.find({
    recipientId: userId,
    status: 'pending',
  }).populate('requesterId', 'username profile.displayName profile.avatar');
};

// Static method to find accepted connections for a user
connectionSchema.statics.findAcceptedConnections = function (userId) {
  return this.find({
    status: 'accepted',
    $or: [{ requesterId: userId }, { recipientId: userId }],
  }).populate(
    'requesterId recipientId',
    'username profile.displayName profile.avatar'
  );
};

// Static method to check if two users are connected
connectionSchema.statics.areConnected = function (userId1, userId2) {
  return this.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userId1, recipientId: userId2 },
      { requesterId: userId2, recipientId: userId1 },
    ],
  });
};

export default mongoose.model('Connection', connectionSchema);
