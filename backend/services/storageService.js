const googleDriveService = require('./googleDriveService');
const logger = require('../utils/logger');

class StorageService {
  /**
   * Upload audio file to storage
   * @param {Object} audioFile - Audio file object
   * @param {string} userId - User ID
   * @param {string} storagePreference - Storage preference (google_drive)
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Object>} Upload result
   */
  async uploadAudio(audioFile, userId, storagePreference, userToken = null) {
    try {
      logger.info('Uploading audio to storage:', {
        userId,
        fileName: audioFile.originalname,
        storagePreference,
      });

      switch (storagePreference) {
        case 'google_drive':
          if (!userToken) {
            throw new Error('Google Drive token required for upload');
          }
          return await googleDriveService.uploadAudio(audioFile, userToken);

        default:
          throw new Error(
            `Unsupported storage preference: ${storagePreference}`
          );
      }
    } catch (error) {
      logger.error('Storage upload failed:', {
        userId,
        fileName: audioFile.originalname,
        storagePreference,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete audio file from storage
   * @param {Object} audioData - Audio data object
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<void>}
   */
  async deleteAudio(audioData, userToken = null) {
    try {
      logger.info('Deleting audio from storage:', {
        fileId: audioData.fileId,
        storageType: audioData.storageType,
      });

      switch (audioData.storageType) {
        case 'google_drive':
          if (!userToken) {
            logger.warn('No Google Drive token provided for deletion');
            return;
          }
          await googleDriveService.deleteAudio(audioData.fileId, userToken);
          break;

        default:
          logger.warn(
            `Unsupported storage type for deletion: ${audioData.storageType}`
          );
      }
    } catch (error) {
      logger.error('Storage deletion failed:', {
        fileId: audioData.fileId,
        storageType: audioData.storageType,
        error: error.message,
      });
      // Don't throw error for deletion failures
    }
  }

  /**
   * Get audio stream URL
   * @param {Object} audioData - Audio data object
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<string>} Audio stream URL
   */
  async getAudioStream(audioData, userToken = null) {
    try {
      switch (audioData.storageType) {
        case 'google_drive':
          // Return Google Drive stream URL
          return audioData.url;

        default:
          throw new Error(`Unsupported storage type: ${audioData.storageType}`);
      }
    } catch (error) {
      logger.error('Failed to get audio stream:', {
        fileId: audioData.fileId,
        storageType: audioData.storageType,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if audio file exists in storage
   * @param {Object} audioData - Audio data object
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<boolean>} True if file exists
   */
  async audioExists(audioData, userToken = null) {
    try {
      switch (audioData.storageType) {
        case 'google_drive':
          if (!userToken) {
            return false;
          }
          return await googleDriveService.fileExists(
            audioData.fileId,
            userToken
          );

        default:
          return false;
      }
    } catch (error) {
      logger.error('Failed to check audio existence:', {
        fileId: audioData.fileId,
        storageType: audioData.storageType,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get file metadata from storage
   * @param {Object} audioData - Audio data object
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(audioData, userToken = null) {
    try {
      switch (audioData.storageType) {
        case 'google_drive':
          if (!userToken) {
            throw new Error('Google Drive token required for metadata');
          }
          return await googleDriveService.getFileMetadata(
            audioData.fileId,
            userToken
          );

        default:
          throw new Error(`Unsupported storage type: ${audioData.storageType}`);
      }
    } catch (error) {
      logger.error('Failed to get file metadata:', {
        fileId: audioData.fileId,
        storageType: audioData.storageType,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user's storage quota
   * @param {string} storagePreference - Storage preference
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Object>} Storage quota information
   */
  async getStorageQuota(storagePreference, userToken = null) {
    try {
      switch (storagePreference) {
        case 'google_drive':
          if (!userToken) {
            throw new Error('Google Drive token required for quota');
          }
          return await googleDriveService.getStorageQuota(userToken);

        default:
          throw new Error(`Unsupported storage type: ${storagePreference}`);
      }
    } catch (error) {
      logger.error('Failed to get storage quota:', {
        storagePreference,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * List user's files in storage
   * @param {string} storagePreference - Storage preference
   * @param {Object} userToken - User's Google Drive token
   * @param {number} pageSize - Number of files to return
   * @returns {Promise<Array>} List of files
   */
  async listUserFiles(storagePreference, userToken = null, pageSize = 50) {
    try {
      switch (storagePreference) {
        case 'google_drive':
          if (!userToken) {
            throw new Error('Google Drive token required for file listing');
          }
          return await googleDriveService.listAppFiles(userToken, pageSize);

        default:
          throw new Error(`Unsupported storage type: ${storagePreference}`);
      }
    } catch (error) {
      logger.error('Failed to list user files:', {
        storagePreference,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get or create app folder in storage
   * @param {string} storagePreference - Storage preference
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<string>} Folder ID
   */
  async getOrCreateAppFolder(storagePreference, userToken = null) {
    try {
      switch (storagePreference) {
        case 'google_drive':
          if (!userToken) {
            throw new Error('Google Drive token required for folder creation');
          }
          return await googleDriveService.getOrCreateAppFolder(userToken);

        default:
          throw new Error(`Unsupported storage type: ${storagePreference}`);
      }
    } catch (error) {
      logger.error('Failed to get or create app folder:', {
        storagePreference,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate storage configuration
   * @param {string} storagePreference - Storage preference
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<boolean>} True if storage is configured
   */
  async validateStorage(storagePreference, userToken = null) {
    try {
      switch (storagePreference) {
        case 'google_drive':
          if (!userToken) {
            return false;
          }
          // Try to get storage quota to validate token
          await this.getStorageQuota(storagePreference, userToken);
          return true;

        default:
          return false;
      }
    } catch (error) {
      logger.error('Storage validation failed:', {
        storagePreference,
        error: error.message,
      });
      return false;
    }
  }
}

module.exports = new StorageService();
