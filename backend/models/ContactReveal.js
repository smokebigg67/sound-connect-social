import mongoose from 'mongoose';

const contactRevealSchema = new mongoose.Schema({
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
    enum: ['pending', 'accepted', 'rejected'],
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
  respondedAt: Date,
});

// Indexes for performance
contactRevealSchema.index({ recipientId: 1, status: 1 });
contactRevealSchema.index({ requesterId: 1, recipientId: 1 });
contactRevealSchema.index({ status: 1, createdAt: 1 });
contactRevealSchema.index({ createdAt: -1 });

// Prevent self-requests
contactRevealSchema.pre('save', function (next) {
  if (this.requesterId.equals(this.recipientId)) {
    return next(new Error('Cannot request contact reveal from yourself'));
  }
  next();
});

// Pre-save middleware to update timestamps based on status
contactRevealSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    ['accepted', 'rejected'].includes(this.status)
  ) {
    this.respondedAt = new Date();
  }
  next();
});

// Method to check if request is pending
contactRevealSchema.methods.isPending = function () {
  return this.status === 'pending';
};

// Method to check if user can respond to request
contactRevealSchema.methods.canRespond = function (userId) {
  return this.status === 'pending' && this.recipientId.equals(userId);
};

// Method to accept request
contactRevealSchema.methods.accept = async function () {
  this.status = 'accepted';
  this.respondedAt = new Date();

  // Update recipient's contactRevealed status
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.recipientId, {
    'profile.contactRevealed': true,
  });

  return this.save();
};

// Method to reject request
contactRevealSchema.methods.reject = function () {
  this.status = 'rejected';
  this.respondedAt = new Date();
  return this.save();
};

// Static method to find pending requests for a user
contactRevealSchema.statics.findPendingRequests = function (userId) {
  return this.find({
    recipientId: userId,
    status: 'pending',
  }).populate('requesterId', 'username profile.displayName profile.avatar');
};

// Static method to find requests sent by a user
contactRevealSchema.statics.findSentRequests = function (userId) {
  return this.find({
    requesterId: userId,
  }).populate('recipientId', 'username profile.displayName profile.avatar');
};

// Static method to find accepted contacts for a user
contactRevealSchema.statics.findAcceptedContacts = function (userId) {
  return this.find({
    status: 'accepted',
    $or: [{ requesterId: userId }, { recipientId: userId }],
  }).populate(
    'requesterId recipientId',
    'username profile.displayName profile.avatar profile.privateContact'
  );
};

// Static method to check if contact is revealed between users
contactRevealSchema.statics.isContactRevealed = function (userId1, userId2) {
  return this.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userId1, recipientId: userId2 },
      { requesterId: userId2, recipientId: userId1 },
    ],
  });
};

// Static method to find existing pending request
contactRevealSchema.statics.findPendingRequest = function (
  requesterId,
  recipientId
) {
  return this.findOne({
    requesterId,
    recipientId,
    status: 'pending',
  });
};

export default mongoose.model('ContactReveal', contactRevealSchema);
