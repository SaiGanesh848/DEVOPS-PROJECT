const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get all audit logs with extensive filtering & pagination
 * @route   GET /api/audit
 * @access  Private (Auditor, Admin)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      eventType,
      status,
      userId,
      fileId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (eventType) {
      query.eventType = eventType;
    }

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.user = userId;
    }

    if (fileId) {
      query.file = fileId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { details: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .populate('file', 'originalName mimeType size')
      .populate({
        path: 'share',
        populate: [
          { path: 'sender', select: 'name email' },
          { path: 'recipient', select: 'name email' },
        ],
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: logs,
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
 * @desc    Get aggregate audit stats
 * @route   GET /api/audit/stats
 * @access  Private (Auditor, Admin)
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const totalEvents = await AuditLog.countDocuments();
    const successfulEvents = await AuditLog.countDocuments({ status: 'SUCCESS' });
    const failedEvents = await AuditLog.countDocuments({ status: 'FAILURE' });

    // Events by type breakdown
    const eventsByType = await AuditLog.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Failed security events breakdown
    const securityThreats = await AuditLog.countDocuments({
      eventType: { $in: ['UNAUTHORIZED_ACCESS', 'DOWNLOAD_FAILED', 'LINK_EXPIRED_ACCESS'] },
    });

    const linkRevocations = await AuditLog.countDocuments({
      eventType: 'LINK_REVOKED',
    });

    // Recent 24 hour activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24Hours = await AuditLog.countDocuments({ createdAt: { $gte: oneDayAgo } });

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        successfulEvents,
        failedEvents,
        securityThreats,
        linkRevocations,
        last24Hours,
        eventsByType: eventsByType.map((item) => ({ type: item._id, count: item.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of failed or unauthorized access attempts
 * @route   GET /api/audit/failed-access
 * @access  Private (Auditor, Admin)
 */
exports.getFailedAccesses = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const query = {
      $or: [
        { status: 'FAILURE' },
        { eventType: { $in: ['UNAUTHORIZED_ACCESS', 'DOWNLOAD_FAILED', 'LINK_EXPIRED_ACCESS'] } },
      ],
    };

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .populate('file', 'originalName mimeType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: logs,
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
 * @desc    Get list of link revocations
 * @route   GET /api/audit/revocations
 * @access  Private (Auditor, Admin)
 */
exports.getLinkRevocations = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const query = { eventType: 'LINK_REVOKED' };

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .populate('file', 'originalName mimeType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: logs,
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
