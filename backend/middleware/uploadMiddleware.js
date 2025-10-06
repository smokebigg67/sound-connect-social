import multer from 'multer';
import path from 'path';
import config from '../config/environment.js';
import audioUtils from '../utils/audioUtils.js';
import { logger } from '../utils/logger.js';

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Check if file is audio
  if (config.SUPPORTED_AUDIO_FORMATS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${
          file.mimetype
        }. Supported formats: ${config.SUPPORTED_AUDIO_FORMATS.join(', ')}`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 1, // Only one file per request
  },
});

export const handleAudioUpload = (req, res, next) => {
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      logger.error('Audio upload error:', err);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File size exceeds limit of ${
            config.MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        });
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Only one audio file can be uploaded at a time',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided',
      });
    }

    // Validate audio file
    try {
      const validation = await audioUtils.validateAudioFile(req.file);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: `Invalid audio file: ${validation.error}`,
        });
      }

      // Get audio duration
      const duration = await audioUtils.getAudioDuration(req.file.path);

      if (duration > config.MAX_AUDIO_DURATION) {
        return res.status(400).json({
          success: false,
          message: `Audio duration exceeds limit of ${config.MAX_AUDIO_DURATION} seconds`,
        });
      }

      // Add audio metadata to request
      req.audioMetadata = {
        duration: Math.round(duration),
        format: req.file.mimetype.split('/')[1] || 'webm',
        fileSize: req.file.size,
        originalName: req.file.originalname,
        path: req.file.path,
      };

      next();
    } catch (validationError) {
      logger.error('Audio validation failed:', validationError);

      // Clean up uploaded file
      const fs = require('fs');
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: `Audio validation failed: ${validationError.message}`,
      });
    }
  });
};

// Middleware to handle multiple audio uploads (for comments, etc.)
export const handleMultipleAudioUpload = (maxFiles = 1) => {
  return (req, res, next) => {
    const uploadMultiple = upload.array('audio', maxFiles);

    uploadMultiple(req, res, async (err) => {
      if (err) {
        logger.error('Multiple audio upload error:', err);

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds limit of ${
              config.MAX_FILE_SIZE / 1024 / 1024
            }MB`,
          });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Maximum ${maxFiles} files can be uploaded at a time`,
          });
        }

        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No audio files provided',
        });
      }

      try {
        // Validate all audio files
        const validatedFiles = [];

        for (const file of req.files) {
          const validation = await audioUtils.validateAudioFile(file);
          if (!validation.isValid) {
            // Clean up all uploaded files
            const fs = require('fs');
            req.files.forEach((f) => {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            });

            return res.status(400).json({
              success: false,
              message: `Invalid audio file: ${validation.error}`,
            });
          }

          // Get audio duration
          const duration = await audioUtils.getAudioDuration(file.path);

          if (duration > config.MAX_AUDIO_DURATION) {
            // Clean up all uploaded files
            const fs = require('fs');
            req.files.forEach((f) => {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            });

            return res.status(400).json({
              success: false,
              message: `Audio duration exceeds limit of ${config.MAX_AUDIO_DURATION} seconds`,
            });
          }

          validatedFiles.push({
            ...file,
            duration: Math.round(duration),
            format: file.mimetype.split('/')[1] || 'webm',
          });
        }

        req.audioFiles = validatedFiles;
        next();
      } catch (validationError) {
        logger.error('Audio validation failed:', validationError);

        // Clean up all uploaded files
        const fs = require('fs');
        if (req.files) {
          req.files.forEach((f) => {
            if (fs.existsSync(f.path)) {
              fs.unlinkSync(f.path);
            }
          });
        }

        return res.status(400).json({
          success: false,
          message: `Audio validation failed: ${validationError.message}`,
        });
      }
    });
  };
};

// Cleanup middleware to remove temporary files
export const cleanupTempFiles = (req, res, next) => {
  import('fs').then(fs => {
    // Clean up after response is sent
    res.on('finish', () => {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (req.files) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    });
  });

  next();
};
