// Application constants

// User roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

// Connection statuses
const CONNECTION_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
};

// Post privacy levels
const POST_PRIVACY = {
  PUBLIC: 'public',
  CONNECTIONS_ONLY: 'connections_only',
  PRIVATE: 'private',
};

// Contact reveal statuses
const CONTACT_REVEAL_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

// Storage types
const STORAGE_TYPES = {
  GOOGLE_DRIVE: 'google_drive',
  DEVICE: 'device',
};

// Audio formats
const AUDIO_FORMATS = {
  MP3: 'audio/mp3',
  WAV: 'audio/wav',
  WEBM: 'audio/webm',
  OGG: 'audio/ogg',
  M4A: 'audio/m4a',
  FLAC: 'audio/flac',
};

// Supported audio formats array
const SUPPORTED_AUDIO_FORMATS = Object.values(AUDIO_FORMATS);

// File size limits
const FILE_SIZE_LIMITS = {
  MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_COVER_SIZE: 10 * 1024 * 1024, // 10MB
};

// Audio duration limits
const AUDIO_DURATION_LIMITS = {
  MAX_POST_DURATION: 600, // 10 minutes
  MAX_COMMENT_DURATION: 120, // 2 minutes
  MIN_DURATION: 1, // 1 second
};

// Rate limiting
const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10,
  },
  SOCIAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 50,
  },
  SEARCH: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 20,
  },
  CONTACT_REVEAL: {
    WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
    MAX_REQUESTS: 5,
  },
  POST_CREATION: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 5,
  },
  CONNECTION_REQUEST: {
    WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
    MAX_REQUESTS: 20,
  },
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SKIP: 0,
};

// Notification types
const NOTIFICATION_TYPES = {
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  CONTACT_REVEAL_REQUEST: 'contact_reveal_request',
  CONTACT_REVEAL_ACCEPTED: 'contact_reveal_accepted',
  NEW_POST: 'new_post',
  POST_COMMENT: 'post_comment',
  POST_LIKE: 'post_like',
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Error messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  ACCOUNT_NOT_FOUND: 'Account not found',
  ACCOUNT_DISABLED: 'Account has been disabled',

  // Validation
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_USERNAME:
    'Username must be 3-30 characters and contain only letters, numbers, and underscores',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORD_TOO_LONG: 'Password cannot exceed 128 characters',

  // Files
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // Connections
  CONNECTION_NOT_FOUND: 'Connection not found',
  CONNECTION_ALREADY_EXISTS: 'Connection already exists',
  CANNOT_CONNECT_SELF: 'Cannot connect with yourself',
  NOT_CONNECTED: 'You are not connected with this user',

  // Posts
  POST_NOT_FOUND: 'Post not found',
  CANNOT_VIEW_POST: 'You do not have permission to view this post',
  CANNOT_MODIFY_POST: 'You can only modify your own posts',

  // Comments
  COMMENT_NOT_FOUND: 'Comment not found',
  CANNOT_MODIFY_COMMENT: 'You can only modify your own comments',

  // Contact reveal
  CONTACT_REQUEST_NOT_FOUND: 'Contact reveal request not found',
  CONTACT_ALREADY_REVEALED: 'Contact information is already revealed',
  REQUEST_ALREADY_PENDING: 'Contact reveal request already pending',

  // General
  INTERNAL_ERROR: 'An internal error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
};

// Success messages
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',

  // User operations
  PROFILE_UPDATED: 'Profile updated successfully',
  AVATAR_UPLOADED: 'Avatar uploaded successfully',
  AVATAR_DELETED: 'Avatar deleted successfully',

  // Connections
  CONNECTION_REQUEST_SENT: 'Connection request sent',
  CONNECTION_ACCEPTED: 'Connection request accepted',
  CONNECTION_REJECTED: 'Connection request rejected',
  CONNECTION_REMOVED: 'Connection removed successfully',
  USER_BLOCKED: 'User blocked successfully',
  USER_UNBLOCKED: 'User unblocked successfully',

  // Posts
  POST_CREATED: 'Post created successfully',
  POST_UPDATED: 'Post updated successfully',
  POST_DELETED: 'Post deleted successfully',
  POST_LIKED: 'Post liked',
  POST_UNLIKED: 'Post unliked',

  // Comments
  COMMENT_CREATED: 'Comment created successfully',
  COMMENT_UPDATED: 'Comment updated successfully',
  COMMENT_DELETED: 'Comment deleted successfully',
  COMMENT_LIKED: 'Comment liked',
  COMMENT_UNLIKED: 'Comment unliked',

  // Contact reveal
  CONTACT_REQUEST_SENT: 'Contact reveal request sent',
  CONTACT_REQUEST_ACCEPTED: 'Contact reveal request accepted',
  CONTACT_REQUEST_REJECTED: 'Contact reveal request rejected',
  CONTACT_REQUEST_CANCELLED: 'Contact reveal request cancelled',

  // Storage
  GOOGLE_DRIVE_CONNECTED: 'Google Drive connected successfully',
  STORAGE_PREFERENCE_UPDATED: 'Storage preference updated successfully',

  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
};

// Time constants
const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// Environment
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
};

// Database
const DATABASE = {
  CONNECTION_STRING:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceconnect',
  OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  },
};

// JWT
const JWT = {
  ACCESS_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY: '30d',
  ISSUER: 'voiceconnect',
  AUDIENCE: 'voiceconnect-users',
};

// Google OAuth
const GOOGLE_OAUTH = {
  SCOPES: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:5000/api/auth/google/callback',
};

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  CONTACT_REVEAL_REQUEST: 'contact_reveal_request',
  CONTACT_REVEAL_ACCEPTED: 'contact_reveal_accepted',
  PASSWORD_RESET: 'password_reset',
};

// Cache settings
const CACHE = {
  TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 2 * 60 * 60 * 1000, // 2 hours
  },
};

// Webhook events
const WEBHOOK_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_DELETED: 'post.deleted',
  COMMENT_CREATED: 'comment.created',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
  CONNECTION_CREATED: 'connection.created',
  CONNECTION_UPDATED: 'connection.updated',
  CONNECTION_DELETED: 'connection.deleted',
};

export {
  USER_ROLES,
  CONNECTION_STATUSES,
  POST_PRIVACY,
  CONTACT_REVEAL_STATUSES,
  STORAGE_TYPES,
  AUDIO_FORMATS,
  SUPPORTED_AUDIO_FORMATS,
  FILE_SIZE_LIMITS,
  AUDIO_DURATION_LIMITS,
  RATE_LIMITS,
  PAGINATION,
  NOTIFICATION_TYPES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TIME,
  ENVIRONMENTS,
  DATABASE,
  JWT,
  GOOGLE_OAUTH,
  EMAIL_TEMPLATES,
  CACHE,
  WEBHOOK_EVENTS,
};
