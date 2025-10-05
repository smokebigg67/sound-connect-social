const { google } = require('googleapis');
const fs = require('fs');
const stream = require('stream');
const { refreshAccessToken } = require('../config/cloudStorage');
const logger = require('../utils/logger');

class GoogleDriveService {
  constructor() {
    this.drive = null;
  }

  /**
   * Get authenticated Google Drive client
   * @param {Object} userToken - User's Google Drive token
   * @returns {Object} Authenticated Google Drive client
   */
  async getDriveClient(userToken) {
    try {
      // Check if token needs refresh
      if (this.isTokenExpired(userToken)) {
        logger.info('Refreshing Google Drive token');
        const newTokens = await refreshAccessToken(userToken.refresh_token);
        userToken = { ...userToken, ...newTokens };
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({
        access_token: userToken.access_token,
        refresh_token: userToken.refresh_token,
        expiry_date: userToken.expiry_date,
      });

      return google.drive({ version: 'v3', auth });
    } catch (error) {
      logger.error('Failed to get Drive client:', error);
      throw new Error(`Google Drive authentication failed: ${error.message}`);
    }
  }

  /**
   * Check if token is expired
   * @param {Object} token - Token object
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    if (!token || !token.expiry_date) return true;
    return token.expiry_date < Date.now();
  }

  /**
   * Upload audio file to Google Drive
   * @param {Object} audioFile - Audio file object
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Object>} Upload result
   */
  async uploadAudio(audioFile, userToken) {
    try {
      const drive = await this.getDriveClient(userToken);

      const fileMetadata = {
        name: `voiceconnect_${Date.now()}.${audioFile.originalname
          .split('.')
          .pop()}`,
        mimeType: audioFile.mimetype,
        parents: ['appDataFolder'], // Private to the app
      };

      const media = {
        mimeType: audioFile.mimetype,
        body: fs.createReadStream(audioFile.path),
      };

      logger.info('Uploading to Google Drive:', {
        fileName: fileMetadata.name,
        fileSize: audioFile.size,
        mimeType: audioFile.mimetype,
      });

      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink',
      });

      logger.info('Google Drive upload successful:', {
        fileId: response.data.id,
        fileName: response.data.name,
      });

      // Make file publicly readable
      try {
        await drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
        logger.info('File permissions set to public:', {
          fileId: response.data.id,
        });
      } catch (permError) {
        logger.warn('Failed to set file permissions:', {
          fileId: response.data.id,
          error: permError.message,
        });
        // Continue even if permission setting fails
      }

      return {
        fileId: response.data.id,
        url: `https://www.googleapis.com/drive/v3/files/${response.data.id}?alt=media`,
        directLink: response.data.webContentLink,
        viewLink: response.data.webViewLink,
        name: response.data.name,
        size: response.data.size,
      };
    } catch (error) {
      logger.error('Google Drive upload failed:', {
        fileName: audioFile.originalname,
        error: error.message,
      });
      throw new Error(`Google Drive upload failed: ${error.message}`);
    }
  }

  /**
   * Delete audio file from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<void>}
   */
  async deleteAudio(fileId, userToken) {
    try {
      const drive = await this.getDriveClient(userToken);

      logger.info('Deleting from Google Drive:', { fileId });

      await drive.files.delete({
        fileId: fileId,
      });

      logger.info('Google Drive deletion successful:', { fileId });
    } catch (error) {
      logger.error('Google Drive deletion failed:', {
        fileId,
        error: error.message,
      });
      throw new Error(`Google Drive deletion failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(fileId, userToken) {
    try {
      const drive = await this.getDriveClient(userToken);

      const response = await drive.files.get({
        fileId: fileId,
        fields:
          'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get file metadata:', {
        fileId,
        error: error.message,
      });
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Check if file exists in Google Drive
   * @param {string} fileId - Google Drive file ID
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(fileId, userToken) {
    try {
      const drive = await this.getDriveClient(userToken);

      await drive.files.get({
        fileId: fileId,
        fields: 'id',
      });

      return true;
    } catch (error) {
      if (error.code === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Create VoiceConnect folder in user's Drive
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<string>} Folder ID
   */
  async createAppFolder(userToken) {
    try {
      const drive = await this.getDriveClient(userToken);

      const folderMetadata = {
        name: 'VoiceConnect',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['appDataFolder'],
      };

      const response = await drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      logger.info('Created VoiceConnect folder:', {
        folderId: response.data.id,
      });
      return response.data.id;
    } catch (error) {
      logger.error('Failed to create app folder:', error);
      throw new Error(`Failed to create app folder: ${error.message}`);
    }
  }

  /**
   * Get or create VoiceConnect folder
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<string>} Folder ID
   */
  async getOrCreateAppFolder(userToken) {
    try {
      const drive = await this.getDriveClient(userToken);

      // Try to find existing folder
      const response = await drive.files.list({
        q: "name = 'VoiceConnect' and mimeType = 'application/vnd.google-apps.folder' and parents in 'appDataFolder'",
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create new folder if not found
      return await this.createAppFolder(userToken);
    } catch (error) {
      logger.error('Failed to get or create app folder:', error);
      throw new Error(`Failed to get or create app folder: ${error.message}`);
    }
  }

  /**
   * Get user's Drive storage quota
   * @param {Object} userToken - User's Google Drive token
   * @returns {Promise<Object>} Storage quota information
   */
  async getStorageQuota(userToken) {
    try {
      const drive = await this.getDriveClient(userToken);

      const response = await drive.about.get({
        fields: 'storageQuota',
      });

      return response.data.storageQuota;
    } catch (error) {
      logger.error('Failed to get storage quota:', error);
      throw new Error(`Failed to get storage quota: ${error.message}`);
    }
  }

  /**
   * List VoiceConnect files in user's Drive
   * @param {Object} userToken - User's Google Drive token
   * @param {number} pageSize - Number of files to return
   * @returns {Promise<Array>} List of files
   */
  async listAppFiles(userToken, pageSize = 50) {
    try {
      const drive = await this.getDriveClient(userToken);

      const response = await drive.files.list({
        q: "parents in 'appDataFolder'",
        spaces: 'appDataFolder',
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
        pageSize: pageSize,
      });

      return response.data.files || [];
    } catch (error) {
      logger.error('Failed to list app files:', error);
      throw new Error(`Failed to list app files: ${error.message}`);
    }
  }
}

module.exports = new GoogleDriveService();
