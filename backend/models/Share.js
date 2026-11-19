const mongoose = require('mongoose');
const crypto = require('crypto');

const ShareSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'File reference is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
    },
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    maxDownloads: {
      type: Number,
      default: 5,
      min: [1, 'Max downloads must be at least 1'],
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true,
      },
      canDownload: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ShareSchema.index({ token: 1 }, { unique: true });
ShareSchema.index({ sender: 1 });
ShareSchema.index({ recipient: 1 });
ShareSchema.index({ file: 1 });
ShareSchema.index({ expiresAt: 1 });
ShareSchema.index({ sender: 1, file: 1 });
ShareSchema.index({ recipient: 1, isRevoked: 1 });

// Instance methods
ShareSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

ShareSchema.methods.isExhausted = function () {
  return this.downloadCount >= this.maxDownloads;
};

ShareSchema.methods.isAccessible = function () {
  return !this.isRevoked && !this.isExpired() && !this.isExhausted();
};

module.exports = mongoose.model('Share', ShareSchema);
