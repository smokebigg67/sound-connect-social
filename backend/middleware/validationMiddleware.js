import Joi from 'joi';
import { logger } from '../utils/logger.js';

// Validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .messages({
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 30 characters',
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
      }),
    displayName: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'Display name cannot exceed 50 characters'
      })
  }),

  // User login
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // User profile update
  updateProfile: Joi.object({
    displayName: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'Display name cannot exceed 50 characters'
      }),
    bio: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Bio cannot exceed 500 characters'
      }),
    privateContact: Joi.string()
      .optional()
      .messages({
        'string.base': 'Contact information must be a string'
      }),
    settings: Joi.object({
      autoAcceptConnections: Joi.boolean().optional(),
      contactRevealPolicy: Joi.string().valid('manual', 'auto_connected').optional(),
      notifications: Joi.object({
        newConnection: Joi.boolean().optional(),
        contactRequest: Joi.boolean().optional(),
        newPost: Joi.boolean().optional()
      }).optional()
    }).optional()
  }),

  // Connection request
  connectionRequest: Joi.object({
    message: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Message cannot exceed 200 characters'
      })
  }),

  // Post creation
  createPost: Joi.object({
    title: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Title cannot exceed 200 characters'
      }),
    tags: Joi.array()
      .items(
        Joi.string()
          .max(30)
          .pattern(/^[a-zA-Z0-9_\-]+$/)
      )
      .max(10)
      .optional()
      .messages({
        'array.max': 'Maximum 10 tags allowed',
        'string.max': 'Tags cannot exceed 30 characters',
        'string.pattern.base': 'Tags can only contain letters, numbers, hyphens, and underscores'
      }),
    privacy: Joi.string()
      .valid('public', 'connections_only', 'private')
      .optional()
      .messages({
        'any.only': 'Privacy must be one of: public, connections_only, private'
      })
  }),

  // Comment creation
  createComment: Joi.object({
    parentCommentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid parent comment ID'
      })
  }),

  // Contact reveal request
  contactRevealRequest: Joi.object({
    message: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Message cannot exceed 200 characters'
      })
  }),

  // Connection response
  connectionResponse: Joi.object({
    status: Joi.string()
      .valid('accepted', 'rejected')
      .required()
      .messages({
        'any.only': 'Status must be either accepted or rejected',
        'any.required': 'Status is required'
      })
  }),

  // Contact reveal response
  contactRevealResponse: Joi.object({
    status: Joi.string()
      .valid('accepted', 'rejected')
      .required()
      .messages({
        'any.only': 'Status must be either accepted or rejected',
        'any.required': 'Status is required'
      })
  }),

  // User search
  userSearch: Joi.object({
    q: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Search query must be at least 2 characters',
        'string.max': 'Search query cannot exceed 50 characters',
        'any.required': 'Search query is required'
      }),
    limit: Joi.number()
      .min(1)
      .max(100)
      .default(20)
      .optional()
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    skip: Joi.number()
      .min(0)
      .default(0)
      .optional()
      .messages({
        'number.min': 'Skip must be at least 0'
      })
  }),

  // Pagination
  pagination: Joi.object({
    limit: Joi.number()
      .min(1)
      .max(100)
      .default(20)
      .optional()
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    skip: Joi.number()
      .min(0)
      .default(0)
      .optional()
      .messages({
        'number.min': 'Skip must be at least 0'
      })
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      logger.warn('Validation error:', {
        error: errorMessage,
        body: req.body,
        url: req.originalUrl,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  };
};

// Query parameter validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      logger.warn('Query validation error:', {
        error: errorMessage,
        query: req.query,
        url: req.originalUrl,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  };
};

// Route-specific validation middleware
const validateRegister = validate(schemas.register);
const validateLogin = validate(schemas.login);
const validateUpdateProfile = validate(schemas.updateProfile);
const validateConnectionRequest = validate(schemas.connectionRequest);
const validateCreatePost = validate(schemas.createPost);
const validateCreateComment = validate(schemas.createComment);
const validateContactRevealRequest = validate(schemas.contactRevealRequest);
const validateConnectionResponse = validate(schemas.connectionResponse);
const validateContactRevealResponse = validate(schemas.contactRevealResponse);
const validateUserSearch = validateQuery(schemas.userSearch);
const validatePagination = validateQuery(schemas.pagination);

// Object ID validation middleware
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const objectId = req.params[paramName];
    
    if (!objectId || !/^[0-9a-fA-F]{24}$/.test(objectId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

export {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateConnectionRequest,
  validateCreatePost,
  validateCreateComment,
  validateContactRevealRequest,
  validateConnectionResponse,
  validateContactRevealResponse,
  validateUserSearch,
  validatePagination,
  validateObjectId,
  schemas
};