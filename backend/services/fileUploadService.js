
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const s3Service = require('./s3Service');
const env = require('../config/env');

class FileUploadService {
  constructor() {
    this.isS3Mode = env.FILE_STORAGE_MODE === 's3';
    this.setupMulter();
  }

  setupMulter() {
    const storage = this.isS3Mode ? multer.memoryStorage() : this.getLocalStorage();
    
    this.upload = multer({
      storage,
      limits: {
        fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
        files: 1
      },
      fileFilter: this.fileFilter.bind(this)
    });
  }

  getLocalStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = this.getUploadPath(req.uploadFolder || 'general');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedName}`);
      }
    });
  }

  getUploadPath(folder) {
    return path.join(__dirname, `../../uploads/${folder}`);
  }

  fileFilter(req, file, cb) {
    const allowedTypes = {
      'application/pdf': true,
      'application/msword': true,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
      'image/jpeg': true,
      'image/jpg': true,
      'image/png': true
    };

    if (!allowedTypes[file.mimetype]) {
      return cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.'));
    }

    cb(null, true);
  }

  /**
   * Process uploaded file - either save to S3 or return local path
   * @param {object} file - Multer file object
   * @param {string} folder - Upload folder (resumes, invoices, documents)
   * @returns {Promise<string>} - File URL
   */
  async processUploadedFile(file, folder) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (this.isS3Mode) {
      // Upload to S3
      const s3Url = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        folder
      );
      return s3Url;
    } else {
      // Local file storage
      return `/uploads/${folder}/${file.filename}`;
    }
  }

  /**
   * Delete file - either from S3 or local storage
   * @param {string} fileUrl - File URL to delete
   * @returns {Promise<void>}
   */
  async deleteFile(fileUrl) {
    if (!fileUrl) return;

    if (this.isS3Mode && fileUrl.includes('amazonaws.com')) {
      // Delete from S3
      await s3Service.deleteFile(fileUrl);
    } else if (!this.isS3Mode && fileUrl.startsWith('/uploads/')) {
      // Delete local file
      const filePath = path.join(__dirname, '..', '..', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Local file deleted:', filePath);
      }
    }
  }

  /**
   * Get file access URL - either S3 presigned URL or local path
   * @param {string} fileUrl - Stored file URL
   * @returns {Promise<string>} - Accessible file URL
   */
  async getFileAccessUrl(fileUrl) {
    if (!fileUrl) return null;

    if (this.isS3Mode && fileUrl.includes('amazonaws.com')) {
      // Generate presigned URL for S3
      return await s3Service.getPresignedUrl(fileUrl);
    } else {
      // Return local file path as-is
      return fileUrl;
    }
  }

  /**
   * Get upload middleware for specific folder
   * @param {string} folder - Upload folder name
   * @returns {function} - Multer middleware
   */
  getUploadMiddleware(folder) {
    return (req, res, next) => {
      req.uploadFolder = folder;
      next();
    };
  }
}

module.exports = new FileUploadService();
