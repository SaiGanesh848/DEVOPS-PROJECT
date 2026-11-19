const crypto = require('crypto');
const path = require('path');

/**
 * Format file size from bytes to human-readable string.
 * @param {number} bytes - File size in bytes.
 * @returns {string} Formatted file size string.
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));

  return `${formattedSize} ${sizes[i]}`;
};

/**
 * Generate a secure random token.
 * @param {number} length - Number of random bytes (default 32).
 * @returns {string} Hex-encoded token.
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Sanitize a filename, removing unsafe characters.
 * @param {string} filename - The original filename.
 * @returns {string} Sanitized filename.
 */
const sanitizeFilename = (filename) => {
  // Get extension
  const ext = path.extname(filename);
  // Get basename without extension
  let name = path.basename(filename, ext);

  // Remove any path traversal characters
  name = name.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
  // Replace multiple underscores/spaces with single underscore
  name = name.replace(/[_ ]+/g, '_');
  // Remove leading/trailing underscores and dots
  name = name.replace(/^[_.]+|[_.]+$/g, '');

  // Ensure the name is not empty
  if (!name) {
    name = 'unnamed_file';
  }

  // Limit length
  if (name.length > 200) {
    name = name.substring(0, 200);
  }

  return `${name}${ext.toLowerCase()}`;
};

/**
 * Extract pagination parameters from query string.
 * @param {object} query - Express query object.
 * @returns {object} { page, limit, skip, sort }
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Parse sort parameter: "field:asc" or "field:desc", default to createdAt:desc
  let sort = { createdAt: -1 };
  if (query.sort) {
    const parts = query.sort.split(':');
    const field = parts[0];
    const order = parts[1] === 'asc' ? 1 : -1;
    sort = { [field]: order };
  }

  return { page, limit, skip, sort };
};

module.exports = {
  formatFileSize,
  generateToken,
  sanitizeFilename,
  getPaginationParams,
};
