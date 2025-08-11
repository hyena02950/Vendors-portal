
const AWS = require('aws-sdk');
const path = require('path');
const env = require('../config/env');

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION
});

const BUCKET_NAME = env.AWS_S3_BUCKET_NAME;

class S3Service {
  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} mimeType - File MIME type
   * @param {string} folder - S3 folder (resumes, invoices, documents)
   * @returns {Promise<string>} - S3 URL
   */
  async uploadFile(fileBuffer, fileName, mimeType, folder) {
    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
        Metadata: {
          uploadedAt: new Date().toISOString()
        }
      };

      const result = await s3.upload(params).promise();
      console.log('File uploaded successfully to S3:', result.Location);
      return result.Location;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Delete file from S3
   * @param {string} s3Url - Full S3 URL
   * @returns {Promise<void>}
   */
  async deleteFile(s3Url) {
    try {
      const key = this.extractKeyFromUrl(s3Url);
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      await s3.deleteObject(params).promise();
      console.log('File deleted successfully from S3:', key);
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generate presigned URL for file access
   * @param {string} s3Url - Full S3 URL
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} - Presigned URL
   */
  async getPresignedUrl(s3Url, expiresIn = 3600) {
    try {
      const key = this.extractKeyFromUrl(s3Url);
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn
      };

      const signedUrl = await s3.getSignedUrlPromise('getObject', params);
      return signedUrl;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate file access URL');
    }
  }

  /**
   * Check if file exists in S3
   * @param {string} s3Url - Full S3 URL
   * @returns {Promise<boolean>}
   */
  async fileExists(s3Url) {
    try {
      const key = this.extractKeyFromUrl(s3Url);
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Sanitize file name for S3
   * @param {string} fileName - Original file name
   * @returns {string} - Sanitized file name
   */
  sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  /**
   * Extract S3 key from full URL
   * @param {string} s3Url - Full S3 URL
   * @returns {string} - S3 key
   */
  extractKeyFromUrl(s3Url) {
    const url = new URL(s3Url);
    return url.pathname.substring(1); // Remove leading slash
  }

  /**
   * Get file metadata from S3
   * @param {string} s3Url - Full S3 URL
   * @returns {Promise<object>} - File metadata
   */
  async getFileMetadata(s3Url) {
    try {
      const key = this.extractKeyFromUrl(s3Url);
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      const result = await s3.headObject(params).promise();
      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        metadata: result.Metadata
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

module.exports = new S3Service();
