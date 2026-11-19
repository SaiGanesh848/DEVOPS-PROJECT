const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const User = require('../models/User');
const Share = require('../models/Share');
const { logEvent, getClientInfo } = require('../services/auditService');
const { sanitizeFilename } = require('../utils/helpers');

/**
 * @desc    Upload file
 * @route   POST /api/files/upload
 * @access  Private (Sender, Admin)
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a file to upload',
      });
    }

    const { description } = req.body;
    const sanitizedOriginal = sanitizeFilename(req.file.originalname);

    const file = await File.create({
      originalName: sanitizedOriginal,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      description: description ? description.trim() : '',
    });

    // Update user storage used
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: req.file.size },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logEvent({
      user: req.user._id,
      file: file._id,
      eventType: 'FILE_UPLOAD',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `Uploaded file "${sanitizedOriginal}" (${req.file.size} bytes)`,
      metadata: { mimeType: req.file.mimetype, size: req.file.size },
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        description: file.description,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    // If multer wrote file on disk but DB insert failed, clean up file
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Failed to cleanup file:', unlinkErr);
      }
    }
    next(error);
  }
};

/**
 * @desc    Get files uploaded by current user
 * @route   GET /api/files/my-files
 * @access  Private (Sender)
 */
exports.getMyFiles = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {
      uploadedBy: req.user._id,
      isDeleted: false,
    };

    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await File.countDocuments(query);
    const files = await File.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get share count for each file
    const fileIds = files.map((f) => f._id);
    const sharesCount = await Share.aggregate([
      { $match: { file: { $in: fileIds } } },
      { $group: { _id: '$file', totalDownloads: { $sum: '$downloadCount' }, totalShares: { $sum: 1 } } },
    ]);

    const shareMap = {};
    sharesCount.forEach((item) => {
      shareMap[item._id.toString()] = {
        totalDownloads: item.totalDownloads,
        totalShares: item.totalShares,
      };
    });

    const enrichedFiles = files.map((file) => {
      const shareData = shareMap[file._id.toString()] || { totalDownloads: 0, totalShares: 0 };
      return {
        ...file.toObject(),
        totalDownloads: shareData.totalDownloads,
        totalShares: shareData.totalShares,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedFiles,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all files in the system
 * @route   GET /api/files/all
 * @access  Private (Admin)
 */
exports.getAllFiles = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await File.countDocuments(query);
    const files = await File.find(query)
      .populate('uploadedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: files,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get file details by ID
 * @route   GET /api/files/:id
 * @access  Private
 */
exports.getFileById = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, isDeleted: false })
      .populate('uploadedBy', 'name email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Role check: Only owner or admin can view file details directly
    if (
      req.user.role !== 'admin' &&
      file.uploadedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this file',
      });
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Direct download file by ID (for sender who uploaded it or admin)
 * @route   GET /api/files/download/:id
 * @access  Private
 */
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).select('+path');

    if (!file || file.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found or deleted',
      });
    }

    const { ipAddress, userAgent } = getClientInfo(req);

    // Only owner or admin can download directly via file ID
    const isOwner = file.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      await logEvent({
        user: req.user._id,
        file: file._id,
        eventType: 'UNAUTHORIZED_ACCESS',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `Direct download denied for file "${file.originalName}"`,
      });

      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this file directly. Use shared link.',
      });
    }

    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File physically not found on server storage',
      });
    }

    await logEvent({
      user: req.user._id,
      file: file._id,
      eventType: 'FILE_DOWNLOAD',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `Direct download by ${req.user.role} "${req.user.name}" for "${file.originalName}"`,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete file
 * @route   DELETE /api/files/:id
 * @access  Private (Owner, Admin)
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const isOwner = file.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file',
      });
    }

    file.isDeleted = true;
    await file.save();

    // Revoke all active shares for this file
    await Share.updateMany({ file: file._id }, { isRevoked: true });

    // Decrease user's storageUsed counter
    await User.findByIdAndUpdate(file.uploadedBy, {
      $inc: { storageUsed: -file.size },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logEvent({
      user: req.user._id,
      file: file._id,
      eventType: 'LINK_REVOKED',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `File "${file.originalName}" marked as deleted and associated shares revoked`,
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
