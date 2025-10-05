const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config/environment');
const logger = require('./logger');

class AudioUtils {
  /**
   * Validate audio file
   * @param {Object} audioFile - Audio file object
   * @returns {Promise<Object>} Validation result
   */
  async validateAudioFile(audioFile) {
    try {
      if (!audioFile || !audioFile.path) {
        return {
          isValid: false,
          error: 'No audio file provided',
        };
      }

      // Check if file exists
      if (!fs.existsSync(audioFile.path)) {
        return {
          isValid: false,
          error: 'Audio file not found',
        };
      }

      // Check file size
      if (audioFile.size > config.MAX_AUDIO_SIZE) {
        return {
          isValid: false,
          error: `File size exceeds limit of ${
            config.MAX_AUDIO_SIZE / 1024 / 1024
          }MB`,
        };
      }

      // Check MIME type
      if (!config.SUPPORTED_AUDIO_FORMATS.includes(audioFile.mimetype)) {
        return {
          isValid: false,
          error: `Unsupported audio format: ${audioFile.mimetype}`,
        };
      }

      // Check file extension
      const extension = path.extname(audioFile.originalname).toLowerCase();
      const supportedExtensions = ['.mp3', '.wav', '.webm', '.ogg'];
      if (!supportedExtensions.includes(extension)) {
        return {
          isValid: false,
          error: `Unsupported file extension: ${extension}`,
        };
      }

      // Try to get audio metadata to validate it's a valid audio file
      try {
        await this.getAudioMetadata(audioFile.path);
      } catch (metadataError) {
        return {
          isValid: false,
          error: 'Invalid audio file format',
        };
      }

      return {
        isValid: true,
        error: null,
      };
    } catch (error) {
      logger.error('Audio validation error:', error);
      return {
        isValid: false,
        error: `Audio validation failed: ${error.message}`,
      };
    }
  }

  /**
   * Get audio duration
   * @param {string} filePath - Path to audio file
   * @returns {Promise<number>} Duration in seconds
   */
  async getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get audio duration: ${err.message}`));
          return;
        }

        const duration = metadata.streams[0]?.duration;
        if (!duration) {
          reject(new Error('Unable to determine audio duration'));
          return;
        }

        resolve(parseFloat(duration));
      });
    });
  }

  /**
   * Get audio metadata
   * @param {string} filePath - Path to audio file
   * @returns {Promise<Object>} Audio metadata
   */
  async getAudioMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get audio metadata: ${err.message}`));
          return;
        }

        const audioStream = metadata.streams.find(
          (stream) => stream.codec_type === 'audio'
        );
        if (!audioStream) {
          reject(new Error('No audio stream found in file'));
          return;
        }

        resolve({
          duration: parseFloat(audioStream.duration),
          bitrate: audioStream.bit_rate,
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: audioStream.sample_rate,
          format: metadata.format.format_name,
        });
      });
    });
  }

  /**
   * Transcribe audio file (placeholder)
   * @param {string} filePath - Path to audio file
   * @returns {Promise<string>} Transcription text
   */
  async transcribeAudio(filePath) {
    try {
      // This is a placeholder for actual transcription service
      // In a real implementation, this would use:
      // - Google Speech-to-Text API
      // - AWS Transcribe
      // - OpenAI Whisper
      // - Or other speech recognition services

      logger.info('Starting audio transcription:', { filePath });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Return mock transcription
      const mockTranscriptions = [
        'This is a sample transcription of the audio content. The user is sharing their thoughts and experiences through voice.',
        "Hello everyone! I'm excited to be using this audio platform to connect with others and share my ideas.",
        'Today I wanted to talk about the importance of voice communication in our digital world. It feels more personal and authentic.',
      ];

      const transcription =
        mockTranscriptions[
          Math.floor(Math.random() * mockTranscriptions.length)
        ];

      logger.info('Audio transcription completed:', {
        filePath,
        transcriptionLength: transcription.length,
      });

      return transcription;
    } catch (error) {
      logger.error('Audio transcription failed:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Convert audio to different format
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {string} format - Target format
   * @returns {Promise<void>}
   */
  async convertAudio(inputPath, outputPath, format = 'mp3') {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat(format)
        .on('end', () => {
          logger.info('Audio conversion completed:', {
            inputPath,
            outputPath,
            format,
          });
          resolve();
        })
        .on('error', (err) => {
          logger.error('Audio conversion failed:', err);
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  /**
   * Compress audio file
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {number} bitrate - Target bitrate (e.g., '128k')
   * @returns {Promise<void>}
   */
  async compressAudio(inputPath, outputPath, bitrate = '128k') {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate(bitrate)
        .on('end', () => {
          logger.info('Audio compression completed:', {
            inputPath,
            outputPath,
            bitrate,
          });
          resolve();
        })
        .on('error', (err) => {
          logger.error('Audio compression failed:', err);
          reject(new Error(`Audio compression failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  /**
   * Trim audio file
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {number} startTime - Start time in seconds
   * @param {number} duration - Duration in seconds
   * @returns {Promise<void>}
   */
  async trimAudio(inputPath, outputPath, startTime, duration) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .on('end', () => {
          logger.info('Audio trimming completed:', {
            inputPath,
            outputPath,
            startTime,
            duration,
          });
          resolve();
        })
        .on('error', (err) => {
          logger.error('Audio trimming failed:', err);
          reject(new Error(`Audio trimming failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  /**
   * Generate audio waveform data
   * @param {string} filePath - Path to audio file
   * @param {number} samples - Number of samples to generate
   * @returns {Promise<Array>} Waveform data array
   */
  async generateWaveform(filePath, samples = 100) {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(44100)
        .format('f32le')
        .on('end', () => {
          // This is a simplified waveform generation
          // In a real implementation, you would process the audio data
          const waveform = Array.from({ length: samples }, () => Math.random());
          resolve(waveform);
        })
        .on('error', (err) => {
          logger.error('Waveform generation failed:', err);
          reject(new Error(`Waveform generation failed: ${err.message}`));
        })
        .pipe(fs.createWriteStream('/tmp/temp_audio.raw'));
    });
  }

  /**
   * Get audio file info
   * @param {string} filePath - Path to audio file
   * @returns {Promise<Object>} File information
   */
  async getAudioInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const metadata = await this.getAudioMetadata(filePath);

      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        duration: metadata.duration,
        bitrate: metadata.bitrate,
        codec: metadata.codec,
        channels: metadata.channels,
        sampleRate: metadata.sampleRate,
        format: metadata.format,
      };
    } catch (error) {
      logger.error('Failed to get audio info:', error);
      throw new Error(`Failed to get audio info: ${error.message}`);
    }
  }

  /**
   * Clean up temporary audio files
   * @param {string} directory - Directory to clean
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<void>}
   */
  async cleanupTempFiles(
    directory = config.UPLOAD_PATH,
    maxAge = 24 * 60 * 60 * 1000
  ) {
    try {
      const files = fs.readdirSync(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile() && now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          logger.info('Cleaned up temporary file:', { filePath });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup temp files:', error);
    }
  }
}

module.exports = new AudioUtils();
