const User = require('../models/User');
const File = require('../models/File');
const Share = require('../models/Share');
const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get Admin Dashboard metrics & activities
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments({ isDeleted: false });
    const totalShares = await Share.countDocuments();

    // Calculate total storage consumed
    const storageStats = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);
    const totalStorage = storageStats[0]?.totalSize || 0;

    // Active shares count
    const now = new Date();
    const activeShares = await Share.countDocuments({
      isRevoked: false,
      expiresAt: { $gt: now },
      $expr: { $lt: ['$downloadCount', '$maxDownloads'] },
    });

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Active vs Inactive users
    const usersByStatus = await User.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } },
    ]);

    // Uploads in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const uploadsLast7Days = await File.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          size: { $sum: '$size' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent 10 audit logs
    const recentActivity = await AuditLog.find()
      .populate('user', 'name email role')
      .populate('file', 'originalName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalFiles,
        totalShares,
        activeShares,
        totalStorage,
        usersByRole: usersByRole.map((u) => ({ role: u._id, count: u.count })),
        usersByStatus: usersByStatus.map((u) => ({ isActive: u._id, count: u.count })),
        uploadsLast7Days,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Sender Dashboard stats & files
 * @route   GET /api/dashboard/sender
 * @access  Private (Sender)
 */
exports.getSenderDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const myFiles = await File.countDocuments({ uploadedBy: userId, isDeleted: false });
    const myShares = await Share.countDocuments({ sender: userId });

    const activeShares = await Share.countDocuments({
      sender: userId,
      isRevoked: false,
      expiresAt: { $gt: now },
      $expr: { $lt: ['$downloadCount', '$maxDownloads'] },
    });

    const user = await User.findById(userId).select('storageUsed');
    const storageUsed = user?.storageUsed || 0;

    // Total downloads across all user's shares
    const downloadStats = await Share.aggregate([
      { $match: { sender: userId } },
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } },
    ]);
    const totalDownloads = downloadStats[0]?.totalDownloads || 0;

    // Recent 5 uploads
    const recentUploads = await File.find({ uploadedBy: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 shares
    const recentShares = await Share.find({ sender: userId })
      .populate('file', 'originalName size mimeType')
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        myFiles,
        myShares,
        activeShares,
        storageUsed,
        totalDownloads,
        recentUploads,
        recentShares,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Recipient Dashboard stats & shared items
 * @route   GET /api/dashboard/recipient
 * @access  Private (Recipient)
 */
exports.getRecipientDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const sharedWithMe = await Share.countDocuments({ recipient: userId });

    const activeLinks = await Share.countDocuments({
      recipient: userId,
      isRevoked: false,
      expiresAt: { $gt: now },
      $expr: { $lt: ['$downloadCount', '$maxDownloads'] },
    });

    const expiredOrRevoked = await Share.countDocuments({
      recipient: userId,
      $or: [
        { isRevoked: true },
        { expiresAt: { $lte: now } },
        { $expr: { $gte: ['$downloadCount', '$maxDownloads'] } },
      ],
    });

    // Recent downloads by this recipient
    const recentDownloads = await AuditLog.find({
      user: userId,
      eventType: 'FILE_DOWNLOAD',
      status: 'SUCCESS',
    })
      .populate('file', 'originalName size mimeType')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 files shared with recipient
    const recentShares = await Share.find({ recipient: userId })
      .populate('file', 'originalName size mimeType isDeleted')
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        sharedWithMe,
        activeLinks,
        expiredOrRevoked,
        downloadsCount: recentDownloads.length,
        recentDownloads,
        recentShares,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Auditor Dashboard stats, alerts, and activities
 * @route   GET /api/dashboard/auditor
 * @access  Private (Auditor)
 */
exports.getAuditorDashboard = async (req, res, next) => {
  try {
    const totalEvents = await AuditLog.countDocuments();

    const failedAccesses = await AuditLog.countDocuments({
      $or: [
        { status: 'FAILURE' },
        { eventType: { $in: ['UNAUTHORIZED_ACCESS', 'DOWNLOAD_FAILED', 'LINK_EXPIRED_ACCESS'] } },
      ],
    });

    const linkRevocations = await AuditLog.countDocuments({ eventType: 'LINK_REVOKED' });

    // Events in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24hCount = await AuditLog.countDocuments({ createdAt: { $gte: oneDayAgo } });

    // Events by type
    const eventsByType = await AuditLog.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Activity over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityLast7Days = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          failures: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent 10 audit events
    const recentActivity = await AuditLog.find()
      .populate('user', 'name email role')
      .populate('file', 'originalName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        failedAccesses,
        linkRevocations,
        last24hCount,
        eventsByType: eventsByType.map((e) => ({ type: e._id, count: e.count })),
        activityLast7Days,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
