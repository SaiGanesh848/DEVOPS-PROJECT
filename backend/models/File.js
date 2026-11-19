const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      default: () => uuidv4(),
      unique: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
      select: false,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ isDeleted: 1 });
FileSchema.index({ createdAt: -1 });
FileSchema.index({ storedName: 1 }, { unique: true });

// Virtual for fileUrl - never expose the real path
FileSchema.virtual('fileUrl').get(function () {
  return `/api/files/download/${this._id}`;
});

module.exports = mongoose.model('File', FileSchema);
