import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    profile: {
      displayName: {
        type: String,
        trim: true,
        maxlength: [50, 'Display name cannot exceed 50 characters'],
      },
      bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
      },
      avatar: String,
      privateContact: {
        type: String,
        select: false, // Hidden by default in queries
      },
      contactRevealed: {
        type: Boolean,
        default: false,
      },
    },
    storage: {
      preference: {
        type: String,
        enum: ['google_drive'],
        default: 'google_drive',
      },
      googleDriveToken: {
        access_token: String,
        refresh_token: String,
        scope: String,
        token_type: String,
        expiry_date: Number,
      },
      deviceSyncKey: {
        type: String,
        select: false,
      },
    },
    settings: {
      autoAcceptConnections: {
        type: Boolean,
        default: false,
      },
      contactRevealPolicy: {
        type: String,
        enum: ['manual', 'auto_connected'],
        default: 'manual',
      },
      notifications: {
        newConnection: { type: Boolean, default: true },
        contactRequest: { type: Boolean, default: true },
        newPost: { type: Boolean, default: true },
      },
    },
    stats: {
      connectionCount: { type: Number, default: 0 },
      postCount: { type: Number, default: 0 },
      audioMinutes: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Virtual for user's full name
userSchema.virtual('fullName').get(function () {
  return this.profile.displayName || this.username;
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'stats.connectionCount': -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();

  // Remove sensitive fields
  delete userObject.password;
  delete userObject.storage.googleDriveToken;
  delete userObject.storage.deviceSyncKey;
  delete userObject.profile.privateContact;

  return userObject;
};

// Method to check if Google Drive token is expired
userSchema.methods.isGoogleDriveTokenExpired = function () {
  if (
    !this.storage.googleDriveToken ||
    !this.storage.googleDriveToken.expiry_date
  ) {
    return true;
  }
  return this.storage.googleDriveToken.expiry_date < Date.now();
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

export default mongoose.model('User', userSchema);
