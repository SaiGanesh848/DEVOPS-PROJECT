const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    share: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Share',
      default: null,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: [
          'FILE_UPLOAD',
          'FILE_SHARE',
          'FILE_DOWNLOAD',
          'DOWNLOAD_FAILED',
          'UNAUTHORIZED_ACCESS',
          'LINK_REVOKED',
          'LINK_EXPIRED_ACCESS',
          'USER_LOGIN',
          'USER_LOGOUT',
          'USER_REGISTER',
        ],
        message: 'Invalid event type',
      },
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['SUCCESS', 'FAILURE'],
        message: 'Status must be SUCCESS or FAILURE',
      },
      default: 'SUCCESS',
    },
    details: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
AuditLogSchema.index({ eventType: 1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ file: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ status: 1 });
AuditLogSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
