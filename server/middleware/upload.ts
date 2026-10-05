import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

const storage = multer.memoryStorage();

export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400, 'INVALID_FILE_TYPE')
      );
    }
    cb(null, true);
  },
});
