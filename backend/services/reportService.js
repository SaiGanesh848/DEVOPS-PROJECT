const mongoose = require('mongoose');
const Share = require('../models/Share');
const AuditLog = require('../models/AuditLog');
const File = require('../models/File');

/**
 * Build a date range filter for MongoDB queries.
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @param {string} field - The date field name to filter on
 * @returns {object} MongoDB filter object
 */
const buildDateFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) {
      filter[field].$gte = new Date(startDate);
    }
    if (endDate) {
      filter[field].$lte = new Date(endDate);
    }
  }
  return filter;
};

/**
 * Get transfer history - joins Share with File and User data.
 *
 * @param {object} filters - { startDate, endDate, userId, status, page, limit }
 * @returns {object} { data, total, page, limit, totalPages }
 */
const getTransferHistory = async (filters = {}) => {
  const {
    startDate,
    endDate,
    userId,
    status,
    page = 1,
    limit = 10,
  } = filters;

  const matchStage = {};

  // Date filter
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  // User filter (sender)
  if (userId) {
    matchStage.sender = new mongoose.Types.ObjectId(userId);
  }

  // Status filter
  if (status === 'active') {
    matchStage.isRevoked = false;
    matchStage.expiresAt = { $gt: new Date() };
  } else if (status === 'revoked') {
    matchStage.isRevoked = true;
  } else if (status === 'expired') {
    matchStage.expiresAt = { $lte: new Date() };
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'files',
        localField: 'file',
        foreignField: '_id',
        as: 'fileInfo',
      },
    },
    { $unwind: { path: '$fileInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderInfo',
      },
    },
    { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'recipient',
        foreignField: '_id',
        as: 'recipientInfo',
      },
    },
    { $unwind: { path: '$recipientInfo', preserveNullAndEmptyArrays: true } },
    {
  $project: {
    _id: 1,
    maxDownloads: 1,
    downloadCount: 1,
    expiresAt: 1,
    isRevoked: 1,
    permissions: 1,
    createdAt: 1,

    file: {
      originalName: '$fileInfo.originalName',
      size: '$fileInfo.size',
      mimeType: '$fileInfo.mimeType',
    },

    sender: {
      name: '$senderInfo.name',
      email: '$senderInfo.email',
    },

    recipient: {
      name: '$recipientInfo.name',
      email: '$recipientInfo.email',
    },

    status: {
      $switch: {
        branches: [
          {
            case: { $eq: ['$isRevoked', true] },
            then: 'revoked',
          },
          {
            case: { $lte: ['$expiresAt', new Date()] },
            then: 'expired',
          },
          {
            case: { $gte: ['$downloadCount', '$maxDownloads'] },
            then: 'exhausted',
          },
        ],
        default: 'active',
      },
    },
  },
   },
   { $sort: { createdAt: -1 } },
{
  $facet: {
    data: [{ $skip: skip }, { $limit: parseInt(limit, 10) }],
    total: [{ $count: 'count' }],
  },
},
];

  const result = await Share.aggregate(pipeline);
  const data = result[0].data;
  const total = result[0].total[0] ? result[0].total[0].count : 0;

  return {
    data,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get file access audit - queries AuditLog with joins.
 *
 * @param {object} filters - { startDate, endDate, userId, fileId, eventType, status, page, limit }
 * @returns {object} { data, total, page, limit, totalPages }
 */
const getFileAccessAudit = async (filters = {}) => {
  const {
    startDate,
    endDate,
    userId,
    fileId,
    eventType,
    status,
    page = 1,
    limit = 10,
  } = filters;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  if (userId) {
    matchStage.user = new mongoose.Types.ObjectId(userId);
  }

  if (fileId) {
    matchStage.file = new mongoose.Types.ObjectId(fileId);
  }

  if (eventType) {
    matchStage.eventType = eventType;
  }

  if (status) {
    matchStage.status = status;
  }

  const skip = (page - 1) * limit;
  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $unwind: {
        path: '$userInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'files',
        localField: 'file',
        foreignField: '_id',
        as: 'fileInfo',
      },
    },
    {
      $unwind: {
        path: '$fileInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'shares',
        localField: 'share',
        foreignField: '_id',
        as: 'shareInfo',
      },
    },
    {
      $unwind: {
        path: '$shareInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $project: {
              _id: 1,
              eventType: 1,
              ipAddress: 1,
              userAgent: 1,
              status: 1,
              details: 1,
              metadata: 1,
              createdAt: 1,
              user: {
                name: '$userInfo.name',
                email: '$userInfo.email',
              },
              file: {
                originalName: '$fileInfo.originalName',
                size: '$fileInfo.size',
              },
              share: {
                expiresAt: '$shareInfo.expiresAt',
              },
            },
          },
        ],
        total: [
          { $count: 'count' },
        ],
      },
    },
  ];
  const result = await AuditLog.aggregate(pipeline);
  const data = result[0].data;
  const total = result[0].total[0] ? result[0].total[0].count : 0;

  return {
    data,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get expired or revoked shares.
 *
 * @param {object} filters - { startDate, endDate, userId, type ('expired'|'revoked'|'all'), page, limit }
 * @returns {object} { data, total, page, limit, totalPages }
 */
const getExpiredShares = async (filters = {}) => {
  const {
    startDate,
    endDate,
    userId,
    type = 'all',
    page = 1,
    limit = 10,
  } = filters;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  if (userId) {
    matchStage.sender = new mongoose.Types.ObjectId(userId);
  }

  if (type === 'expired') {
    matchStage.expiresAt = { $lte: new Date() };
  } else if (type === 'revoked') {
    matchStage.isRevoked = true;
  } else {
    // all: expired or revoked
    matchStage.$or = [
      { expiresAt: { $lte: new Date() } },
      { isRevoked: true },
    ];
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'files',
        localField: 'file',
        foreignField: '_id',
        as: 'fileInfo',
      },
    },
    { $unwind: { path: '$fileInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderInfo',
      },
    },
    { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'recipient',
        foreignField: '_id',
        as: 'recipientInfo',
      },
    },
    { $unwind: { path: '$recipientInfo', preserveNullAndEmptyArrays: true } },
    {
  $project: {
    _id: 1,
    maxDownloads: 1,
    downloadCount: 1,
    expiresAt: 1,
    isRevoked: 1,
    createdAt: 1,

    file: {
      originalName: '$fileInfo.originalName',
      size: '$fileInfo.size',
    },

    sender: {
      name: '$senderInfo.name',
      email: '$senderInfo.email',
    },

    recipient: {
      name: '$recipientInfo.name',
      email: '$recipientInfo.email',
    },
  },
},
    { $sort: { expiresAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: parseInt(limit, 10) }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const result = await Share.aggregate(pipeline);
  const data = result[0].data;
  const total = result[0].total[0] ? result[0].total[0].count : 0;

  return {
    data,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get storage usage - aggregate file sizes by user and type.
 *
 * @param {object} filters - { userId, page, limit }
 * @returns {object} { data, total, page, limit, totalPages, summary }
 */
const getStorageUsage = async (filters = {}) => {
  const { userId, page = 1, limit = 10 } = filters;

  const matchStage = { isDeleted: false };

  if (userId) {
    matchStage.uploadedBy = new mongoose.Types.ObjectId(userId);
  }

  const skip = (page - 1) * limit;

  // Aggregate by user
  const byUserPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$uploadedBy',
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        fileTypes: { $addToSet: '$mimeType' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
    { $sort: { totalSize: -1 } },
    {
  $project: {
    _id: 1,
    name: '$userInfo.name',
    email: '$userInfo.email',
    fileCount: '$totalFiles',
    storageUsed: '$totalSize',
    isActive: '$userInfo.isActive',
    fileTypes: 1,
  },
},
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: parseInt(limit, 10) }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  // Aggregate by file type
  const byTypePipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$mimeType',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
      },
    },
    { $sort: { totalSize: -1 } },
  ];

  // Overall summary
  const summaryPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        avgFileSize: { $avg: '$size' },
        maxFileSize: { $max: '$size' },
      },
    },
  ];

  const [byUserResult, byTypeResult, summaryResult] = await Promise.all([
    File.aggregate(byUserPipeline),
    File.aggregate(byTypePipeline),
    File.aggregate(summaryPipeline),
  ]);

  const data = byUserResult[0].data;
  const total = byUserResult[0].total[0] ? byUserResult[0].total[0].count : 0;
  const summary = summaryResult[0] || {
    totalFiles: 0,
    totalSize: 0,
    avgFileSize: 0,
    maxFileSize: 0,
  };

  return {
    data,
    byType: byTypeResult,
    summary,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  getTransferHistory,
  getFileAccessAudit,
  getExpiredShares,
  getStorageUsage,
};
