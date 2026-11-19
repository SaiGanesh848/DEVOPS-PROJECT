const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 *
 * @param {object} params
 * @param {string|null} params.user - User ObjectId
 * @param {string|null} params.file - File ObjectId
 * @param {string|null} params.share - Share ObjectId
 * @param {string} params.eventType - One of the defined event types
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent string
 * @param {string} params.status - 'SUCCESS' or 'FAILURE'
 * @param {string} params.details - Human-readable description
 * @param {object} params.metadata - Additional data
 * @returns {Promise<object>} Created audit log document
 */
const logEvent = async ({
  user = null,
  file = null,
  share = null,
  eventType,
  ipAddress = '',
  userAgent = '',
  status = 'SUCCESS',
  details = '',
  metadata = {},
}) => {
  try {
    const auditLog = await AuditLog.create({
      user,
      file,
      share,
      eventType,
      ipAddress,
      userAgent,
      status,
      details,
      metadata,
    });

    return auditLog;
  } catch (error) {
    // Audit logging should not break the application flow.
    // Log the error and continue.
    console.error('Audit logging failed:', error.message);
    return null;
  }
};

/**
 * Helper to extract client info from the request object.
 *
 * @param {object} req - Express request object
 * @returns {object} { ipAddress, userAgent }
 */
const getClientInfo = (req) => {
  const ipAddress =
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';
  const userAgent = req.headers['user-agent'] || '';

  return { ipAddress, userAgent };
};

module.exports = { logEvent, getClientInfo };
