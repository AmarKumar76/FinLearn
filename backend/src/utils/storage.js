import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';

// Storage directory in backend/uploads/materials (kept outside public web root)
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'materials');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer disk storage using randomized UUID/hex names to prevent path traversal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}.pdf`);
  },
});

// File filter: strict PDF extension and mime type validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new Error('Only educational PDF documents (.pdf) are permitted'));
  }
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Invalid MIME type. Must be application/pdf'));
  }
  cb(null, true);
};

export const pdfUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
});

/**
 * Validates PDF magic bytes (%PDF-) to guard against renamed malicious files
 */
export function validatePdfMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString('utf-8') === '%PDF-';
  } catch (err) {
    return false;
  }
}

export default {
  pdfUpload,
  validatePdfMagicBytes,
  UPLOAD_DIR,
};
