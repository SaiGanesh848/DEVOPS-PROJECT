const path = require('path');
const fs = require('fs');
const Share = require('../models/Share');
const File = require('../models/File');
const User = require('../models/User');
const { logEvent, getClientInfo } = require('../services/auditService');

/**
 * @desc    Get list of active recipients for sharing
 * @route   GET /api/shares/recipients
 * @access  Private (Sender, Admin)
 */
exports.getRecipients = async (req, res, next) => {
  try {
    const recipients = await User.find({ role: 'recipient', isActive: true })
      .select('name email role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: recipients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new file share
 * @route   POST /api/shares
 * @access  Private (Sender, Admin)
 */
exports.createShare = async (req, res, next) => {
  try {
    const { fileId, recipientId, maxDownloads = 5, expiresAt, permissions } = req.body;

    // Verify file exists, belongs to user (or user is admin), and not deleted
    const file = await File.findOne({ _id: fileId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only share files that you uploaded',
      });
    }

    // Verify recipient exists and is active
    const recipient = await User.findOne({ _id: recipientId, isActive: true });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or account is inactive',
      });
    }

    // Validate expiration date
    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime()) || expiry <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date must be a valid future date',
      });
    }

    const share = await Share.create({
      file: file._id,
      sender: req.user._id,
      recipient: recipient._id,
      maxDownloads: parseInt(maxDownloads, 10) || 5,
      expiresAt: expiry,
      permissions: {
        canView: permissions?.canView !== undefined ? permissions.canView : true,
        canDownload: permissions?.canDownload !== undefined ? permissions.canDownload : true,
      },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logEvent({
      user: req.user._id,
      file: file._id,
      share: share._id,
      eventType: 'FILE_SHARE',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `File "${file.originalName}" shared with ${recipient.email} (Limit: ${share.maxDownloads}, Expiry: ${expiry.toISOString()})`,
      metadata: { recipientEmail: recipient.email, maxDownloads: share.maxDownloads, expiresAt: expiry },
    });

    res.status(201).json({
      success: true,
      message: 'Share link created successfully',
      data: {
        id: share._id,
        token: share.token,
        file: {
          id: file._id,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
        },
        recipient: {
          id: recipient._id,
          name: recipient.name,
          email: recipient.email,
        },
        maxDownloads: share.maxDownloads,
        downloadCount: share.downloadCount,
        expiresAt: share.expiresAt,
        isRevoked: share.isRevoked,
        permissions: share.permissions,
        createdAt: share.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all shares created by current user (Sender)
 * @route   GET /api/shares/my-shares
 * @access  Private (Sender)
 */
exports.getMyShares = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { sender: req.user._id };

    const now = new Date();
    if (status === 'active') {
      query.isRevoked = false;
      query.expiresAt = { $gt: now };
      query.$expr = { $lt: ['$downloadCount', '$maxDownloads'] };
    } else if (status === 'revoked') {
      query.isRevoked = true;
    } else if (status === 'expired') {
      query.$or = [
        { expiresAt: { $lte: now } },
        { $expr: { $gte: ['$downloadCount', '$maxDownloads'] } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await Share.countDocuments(query);
    const shares = await Share.find(query)
      .populate('file', 'originalName size mimeType isDeleted')
      .populate('recipient', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const enriched = shares.map((s) => {
      let currentStatus = 'active';
      if (s.isRevoked) currentStatus = 'revoked';
      else if (new Date() > s.expiresAt) currentStatus = 'expired';
      else if (s.downloadCount >= s.maxDownloads) currentStatus = 'exhausted';

      return {
        ...s.toObject(),
        status: currentStatus,
      };
    });

    res.status(200).json({
      success: true,
      data: enriched,
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
 * @desc    Get files shared with current recipient
 * @route   GET /api/shares/shared-with-me
 * @access  Private (Recipient)
 */
exports.getSharedWithMe = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { recipient: req.user._id };

    const now = new Date();
    if (status === 'active') {
      query.isRevoked = false;
      query.expiresAt = { $gt: now };
      query.$expr = { $lt: ['$downloadCount', '$maxDownloads'] };
    } else if (status === 'revoked') {
      query.isRevoked = true;
    } else if (status === 'expired') {
      query.$or = [
        { expiresAt: { $lte: now } },
        { $expr: { $gte: ['$downloadCount', '$maxDownloads'] } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await Share.countDocuments(query);
    const shares = await Share.find(query)
      .populate('file', 'originalName size mimeType isDeleted')
      .populate('sender', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const enriched = shares.map((s) => {
      let currentStatus = 'active';
      let statusReason = '';

      if (s.isRevoked) {
        currentStatus = 'revoked';
        statusReason = 'The sender revoked this share link.';
      } else if (new Date() > s.expiresAt) {
        currentStatus = 'expired';
        statusReason = 'This share link has expired.';
      } else if (s.downloadCount >= s.maxDownloads) {
        currentStatus = 'exhausted';
        statusReason = 'Maximum download limit has been reached.';
      }

      return {
        ...s.toObject(),
        status: currentStatus,
        statusReason,
        downloadsRemaining: Math.max(0, s.maxDownloads - s.downloadCount),
      };
    });

    res.status(200).json({
      success: true,
      data: enriched,
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
 * @desc    Get details of a shared file by token
 * @route   GET /api/shares/token/:token/details
 * @access  Private (or authorized token bearer)
 */
exports.getShareDetails = async (req, res, next) => {
  try {
    const share = await Share.findOne({ token: req.params.token })
      .populate('file', 'originalName size mimeType description isDeleted')
      .populate('sender', 'name email')
      .populate('recipient', 'name email');

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or invalid token',
      });
    }

    const isExpired = share.isExpired();
    const isExhausted = share.isExhausted();
    const isRevoked = share.isRevoked;
    const isAccessible = share.isAccessible() && !share.file.isDeleted;

    let reason = '';
    if (isRevoked) reason = 'This link has been revoked by the sender.';
    else if (isExpired) reason = 'This link has expired.';
    else if (isExhausted) reason = 'Download limit for this link has been reached.';
    else if (share.file.isDeleted) reason = 'The file is no longer available.';

    res.status(200).json({
      success: true,
      data: {
        id: share._id,
        file: share.file,
        sender: share.sender,
        recipient: share.recipient,
        maxDownloads: share.maxDownloads,
        downloadCount: share.downloadCount,
        downloadsRemaining: Math.max(0, share.maxDownloads - share.downloadCount),
        expiresAt: share.expiresAt,
        isRevoked,
        isExpired,
        isExhausted,
        isAccessible,
        reason,
        permissions: share.permissions,
        createdAt: share.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Access and download file via share token
 * @route   GET /api/shares/access/:token
 * @access  Public / Authenticated Recipient
 */
exports.accessShare = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { ipAddress, userAgent } = getClientInfo(req);

    const share = await Share.findOne({ token }).populate('file', '+path originalName size mimeType isDeleted');

    if (!share) {
      await logEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `Access attempt with nonexistent share token: ${token}`,
      });

      return res.status(404).json({
        success: false,
        message: 'Invalid or nonexistent share link.',
      });
    }

    const userId = req.user ? req.user._id : share.recipient;

    // Check if recipient matches (if user is authenticated)
    if (req.user && req.user.role === 'recipient' && req.user._id.toString() !== share.recipient.toString()) {
      await logEvent({
        user: req.user._id,
        file: share.file._id,
        share: share._id,
        eventType: 'UNAUTHORIZED_ACCESS',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `User ${req.user.email} attempted to access file shared with another recipient`,
      });

      return res.status(403).json({
        success: false,
        message: 'This file was not shared with your account.',
      });
    }

    // Check revocation
    if (share.isRevoked) {
      await logEvent({
        user: userId,
        file: share.file._id,
        share: share._id,
        eventType: 'LINK_REVOKED',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: 'Attempted to access revoked share link',
      });

      return res.status(410).json({
        success: false,
        message: 'This share link has been revoked by the sender.',
      });
    }

    // Check expiry
    if (share.isExpired()) {
      await logEvent({
        user: userId,
        file: share.file._id,
        share: share._id,
        eventType: 'LINK_EXPIRED_ACCESS',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `Attempted access after expiration date (${share.expiresAt.toISOString()})`,
      });

      return res.status(410).json({
        success: false,
        message: 'This share link has expired.',
      });
    }

    // Check download limit
    if (share.isExhausted()) {
      await logEvent({
        user: userId,
        file: share.file._id,
        share: share._id,
        eventType: 'DOWNLOAD_FAILED',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `Download limit reached (${share.downloadCount}/${share.maxDownloads})`,
      });

      return res.status(403).json({
        success: false,
        message: 'Maximum download limit reached for this share link.',
      });
    }

    // Check download permission
    if (!share.permissions.canDownload) {
      return res.status(403).json({
        success: false,
        message: 'Download permission is disabled for this link.',
      });
    }

    // Check file state
    if (!share.file || share.file.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'The requested file has been removed or deleted.',
      });
    }

    // Increment download count
    share.downloadCount += 1;
    await share.save();

    const filePath = path.resolve(share.file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File physically not found on server storage.',
      });
    }

    // Audit log success
    await logEvent({
      user: userId,
      file: share.file._id,
      share: share._id,
      eventType: 'FILE_DOWNLOAD',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `File "${share.file.originalName}" downloaded via share token (${share.downloadCount}/${share.maxDownloads})`,
      metadata: { downloadCount: share.downloadCount, maxDownloads: share.maxDownloads },
    });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(share.file.originalName)}"`);
    res.setHeader('Content-Type', share.file.mimeType);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke a share link
 * @route   PUT /api/shares/:id/revoke
 * @access  Private (Sender, Admin)
 */
exports.revokeShare = async (req, res, next) => {
  try {
    const share = await Share.findById(req.params.id).populate('file', 'originalName');

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share record not found',
      });
    }

    if (req.user.role !== 'admin' && share.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revoke this share link',
      });
    }

    share.isRevoked = true;
    await share.save();

    const { ipAddress, userAgent } = getClientInfo(req);
    await logEvent({
      user: req.user._id,
      file: share.file?._id,
      share: share._id,
      eventType: 'LINK_REVOKED',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `Sender revoked share link for file "${share.file?.originalName}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Share link revoked successfully',
      data: {
        id: share._id,
        isRevoked: share.isRevoked,
      },
    });
  } catch (error) {
    next(error);
  }
};
