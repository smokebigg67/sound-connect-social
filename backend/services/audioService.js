const audioUtils = require('../utils/audioUtils');
const storageService = require('./storageService');
const logger = require('../utils/logger');

class AudioService {
  /**
   * Process audio file for upload
   * @param {Object} audioFile - Audio file object
   * @param {string} userId - User ID
   * @param {string} storagePreference - Storage preference (google_drive)
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Object>} Processed audio data
   */
  async processAudio(audioFile, userId, storagePreference, userToken = null) {
    try {
      logger.info('Processing audio file:', {
        userId,
        fileName: audioFile.originalname,
        fileSize: audioFile.size,
        storagePreference,
      });

      // Validate audio file
      const validation = await audioUtils.validateAudioFile(audioFile);
      if (!validation.isValid) {
        throw new Error(`Audio validation failed: ${validation.error}`);
      }

      // Get audio duration
      const duration = await audioUtils.getAudioDuration(audioFile.path);

      // Upload to chosen storage
      const uploadResult = await storageService.uploadAudio(
        audioFile,
        userId,
        storagePreference,
        userToken
      );

      logger.info('Audio upload completed:', {
        userId,
        fileId: uploadResult.fileId,
        storageType: storagePreference,
        duration: Math.round(duration),
      });

      // Generate transcription (optional - can be async)
      let transcription = null;
      try {
        transcription = await audioUtils.transcribeAudio(audioFile.path);
        logger.info('Audio transcription completed:', {
          userId,
          hasTranscription: !!transcription,
        });
      } catch (transcribeError) {
        logger.warn('Transcription failed:', {
          userId,
          error: transcribeError.message,
        });
        // Continue without transcription
      }

      return {
        storageType: storagePreference,
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        duration: Math.round(duration),
        format: audioFile.mimetype.split('/')[1] || 'webm',
        fileSize: audioFile.size,
        transcription,
      };
    } catch (error) {
      logger.error('Audio processing failed:', {
        userId,
        error: error.message,
        fileName: audioFile?.originalName,
      });
      throw new Error(`Audio processing failed: ${error.message}`);
    }
  }

  /**
   * Delete audio file from storage
   * @param {Object} audioData - Audio data object
   * @param {string} userId - User ID
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<void>}
   */
  async deleteAudio(audioData, userId, userToken = null) {
    try {
      logger.info('Deleting audio file:', {
        userId,
        fileId: audioData.fileId,
        storageType: audioData.storageType,
      });

      await storageService.deleteAudio(audioData, userToken);

      logger.info('Audio deletion completed:', {
        userId,
        fileId: audioData.fileId,
      });
    } catch (error) {
      logger.error('Audio deletion failed:', {
        userId,
        fileId: audioData.fileId,
        error: error.message,
      });
      // Don't throw error for deletion failures to avoid blocking operations
    }
  }

  /**
   * Get audio stream URL
   * @param {Object} audioData - Audio data object
   * @param {string} userId - User ID
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<string>} Audio stream URL
   */
  async getAudioStream(audioData, userId, userToken = null) {
    try {
      return await storageService.getAudioStream(audioData, userToken);
    } catch (error) {
      logger.error('Failed to get audio stream:', {
        userId,
        fileId: audioData.fileId,
        error: error.message,
      });
      throw new Error(`Failed to get audio stream: ${error.message}`);
    }
  }

  /**
   * Process multiple audio files
   * @param {Array} audioFiles - Array of audio file objects
   * @param {string} userId - User ID
   * @param {string} storagePreference - Storage preference
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Array>} Array of processed audio data
   */
  async processMultipleAudio(
    audioFiles,
    userId,
    storagePreference,
    userToken = null
  ) {
    try {
      const results = [];

      for (const audioFile of audioFiles) {
        const processedAudio = await this.processAudio(
          audioFile,
          userId,
          storagePreference,
          userToken
        );
        results.push(processedAudio);
      }

      return results;
    } catch (error) {
      logger.error('Multiple audio processing failed:', {
        userId,
        error: error.message,
        fileCount: audioFiles.length,
      });
      throw new Error(`Multiple audio processing failed: ${error.message}`);
    }
  }

  /**
   * Validate audio metadata
   * @param {Object} audioData - Audio data object
   * @returns {Object} Validation result
   */
  validateAudioMetadata(audioData) {
    const errors = [];

    // Check required fields
    if (!audioData.storageType) {
      errors.push('Storage type is required');
    }

    if (!audioData.fileId) {
      errors.push('File ID is required');
    }

    if (!audioData.url) {
      errors.push('URL is required');
    }

    if (!audioData.duration || audioData.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (!audioData.format) {
      errors.push('Format is required');
    }

    if (!audioData.fileSize || audioData.fileSize <= 0) {
      errors.push('File size must be greater than 0');
    }

    // Validate duration limits
    if (audioData.duration > 600) {
      // 10 minutes
      errors.push('Duration cannot exceed 10 minutes');
    }

    if (audioData.duration < 1) {
      errors.push('Duration must be at least 1 second');
    }

    // Validate file size limits
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (audioData.fileSize > maxSize) {
      errors.push('File size cannot exceed 50MB');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update audio metadata
   * @param {Object} audioData - Audio data object
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated audio data
   */
  updateAudioMetadata(audioData, updates) {
    const allowedUpdates = ['title', 'tags', 'transcription', 'language'];
    const updatedData = { ...audioData };

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updatedData[key] = value;
      }
    }

    return updatedData;
  }
}

module.exports = new AudioService();
