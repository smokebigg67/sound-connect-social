import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { logger } from './logger.js';

class Helpers {
  /**
   * Generate random string
   * @param {number} length - Length of string to generate
   * @returns {string} Random string
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateUniqueId() {
    return crypto.randomUUID();
  }

  /**
   * Generate secure token
   * @param {number} length - Token length
   * @returns {string} Secure token
   */
  generateSecureToken(length = 64) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  /**
   * Hash password
   * @param {string} password - Password to hash
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    return new Promise((resolve, reject) => {
      const bcrypt = require('bcryptjs');
      const saltRounds = 12;

      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(hash);
      });
    });
  }

  /**
   * Compare password with hash
   * @param {string} password - Password to compare
   * @param {string} hash - Hash to compare against
   * @returns {Promise<boolean>} True if passwords match
   */
  async comparePassword(password, hash) {
    return new Promise((resolve, reject) => {
      const bcrypt = require('bcryptjs');

      bcrypt.compare(password, hash, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * Sanitize string input
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return '';

    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {boolean} True if username is valid
   */
  isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  }

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {string} format - Format type
   * @returns {string} Formatted date string
   */
  formatDate(date, format = 'relative') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
      case 'relative':
        return this.getRelativeTime(dateObj);
      case 'short':
        return dateObj.toLocaleDateString();
      case 'long':
        return dateObj.toLocaleString();
      case 'iso':
        return dateObj.toISOString();
      default:
        return dateObj.toString();
    }
  }

  /**
   * Get relative time string
   * @param {Date} date - Date to format
   * @returns {string} Relative time string
   */
  getRelativeTime(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  /**
   * Create directory if it doesn't exist
   * @param {string} dirPath - Directory path
   * @returns {boolean} True if directory exists or was created
   */
  ensureDirectoryExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info('Directory created:', { dirPath });
      }
      return true;
    } catch (error) {
      logger.error('Failed to create directory:', {
        dirPath,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Clean filename
   * @param {string} filename - Filename to clean
   * @returns {string} Cleaned filename
   */
  cleanFilename(filename) {
    return filename
      .replace(/[^a-z0-9\-_\.]/gi, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @param {string} prefix - Optional prefix
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalName, prefix = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = path.extname(originalName);
    const name = this.cleanFilename(path.basename(originalName, extension));

    return `${prefix}${timestamp}_${random}_${name}${extension}`;
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to extract domain from
   * @returns {string} Domain
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Paginate array
   * @param {Array} array - Array to paginate
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Paginated result
   */
  paginateArray(array, page = 1, limit = 20) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedItems = array.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      hasNext: endIndex < array.length,
      hasPrev: page > 1,
    };
  }

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit time in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Safe JSON parse
   * @param {string} str - String to parse
   * @param {Object} defaultValue - Default value if parsing fails
   * @returns {Object} Parsed object or default value
   */
  safeJsonParse(str, defaultValue = {}) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string} File extension
   */
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Check if file is audio
   * @param {string} filename - Filename
   * @returns {boolean} True if file is audio
   */
  isAudioFile(filename) {
    const audioExtensions = ['.mp3', '.wav', '.webm', '.ogg', '.m4a', '.flac'];
    const extension = this.getFileExtension(filename);
    return audioExtensions.includes(extension);
  }

  /**
   * Generate slug from string
   * @param {string} text - Text to convert to slug
   * @returns {string} Slug
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }
}

export default new Helpers();
