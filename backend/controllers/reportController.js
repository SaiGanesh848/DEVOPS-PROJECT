const reportService = require('../services/reportService');
const { generateCSVManual } = require('../utils/csvExport');

/**
 * @desc    Get Transfer History Report
 * @route   GET /api/reports/transfer-history
 * @access  Private (Admin, Auditor)
 */
exports.getTransferHistory = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      status: req.query.status,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const report = await reportService.getTransferHistory(filters);
    res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get File Access Audit Report
 * @route   GET /api/reports/file-access-audit
 * @access  Private (Admin, Auditor)
 */
exports.getFileAccessAudit = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      status: req.query.status,
      eventType: req.query.eventType,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const report = await reportService.getFileAccessAudit(filters);
    res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Expired Shares Report
 * @route   GET /api/reports/expired-shares
 * @access  Private (Admin, Auditor)
 */
exports.getExpiredShares = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const report = await reportService.getExpiredShares(filters);
    res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Storage Usage Report
 * @route   GET /api/reports/storage-usage
 * @access  Private (Admin)
 */
exports.getStorageUsage = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const report = await reportService.getStorageUsage(filters);
    res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export any report to CSV
 * @route   GET /api/reports/export
 * @access  Private (Admin, Auditor)
 */
exports.exportReport = async (req, res, next) => {
  try {
    const reportType = req.params.reportType || req.query.reportType || 'transfers';
    const { startDate, endDate, userId, status, eventType } = req.query;

    let csvData = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename = `report-${reportType}-${timestamp}.csv`;

    if (reportType === 'transfers') {
      const result = await reportService.getTransferHistory({
        startDate,
        endDate,
        userId,
        status,
        page: 1,
        limit: 5000,
      });

      const headers = [
        { id: 'fileName', title: 'File Name' },
        { id: 'senderName', title: 'Sender Name' },
        { id: 'senderEmail', title: 'Sender Email' },
        { id: 'recipientName', title: 'Recipient Name' },
        { id: 'recipientEmail', title: 'Recipient Email' },
        { id: 'downloads', title: 'Downloads (Used/Max)' },
        { id: 'status', title: 'Status' },
        { id: 'createdAt', title: 'Shared Date' },
        { id: 'expiresAt', title: 'Expiration Date' },
      ];

      const rows = result.data.map((item) => ({
        fileName: item.file?.originalName || 'N/A',
        senderName: item.sender?.name || 'N/A',
        senderEmail: item.sender?.email || 'N/A',
        recipientName: item.recipient?.name || 'N/A',
        recipientEmail: item.recipient?.email || 'N/A',
        downloads: `${item.downloadCount || 0}/${item.maxDownloads || 0}`,
        status: item.status || 'active',
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : '',
      }));

      csvData = generateCSVManual(rows, headers);
    } else if (reportType === 'audit') {
      const result = await reportService.getFileAccessAudit({
        startDate,
        endDate,
        userId,
        status,
        eventType,
        page: 1,
        limit: 5000,
      });

      const headers = [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'userName', title: 'User Name' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'eventType', title: 'Event Type' },
        { id: 'fileName', title: 'File' },
        { id: 'status', title: 'Status' },
        { id: 'ipAddress', title: 'IP Address' },
        { id: 'details', title: 'Details' },
      ];

      const rows = result.data.map((item) => ({
        timestamp: item.createdAt ? new Date(item.createdAt).toISOString() : '',
        userName: item.user?.name || 'Anonymous',
        userEmail: item.user?.email || 'N/A',
        eventType: item.eventType || '',
        fileName: item.file?.originalName || 'N/A',
        status: item.status || '',
        ipAddress: item.ipAddress || '',
        details: item.details || '',
      }));

      csvData = generateCSVManual(rows, headers);
    } else if (reportType === 'expired') {
      const result = await reportService.getExpiredShares({
        startDate,
        endDate,
        userId,
        page: 1,
        limit: 5000,
      });

      const headers = [
        { id: 'fileName', title: 'File Name' },
        { id: 'senderName', title: 'Sender' },
        { id: 'recipientName', title: 'Recipient' },
        { id: 'downloadCount', title: 'Total Downloads' },
        { id: 'maxDownloads', title: 'Max Downloads' },
        { id: 'expiresAt', title: 'Expired Date' },
        { id: 'status', title: 'Status' },
      ];

      const rows = result.data.map((item) => ({
        fileName: item.file?.originalName || 'N/A',
        senderName: item.sender?.name || 'N/A',
        recipientName: item.recipient?.name || 'N/A',
        downloadCount: item.downloadCount || 0,
        maxDownloads: item.maxDownloads || 0,
        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : '',
        status: item.isRevoked ? 'Revoked' : 'Expired',
      }));

      csvData = generateCSVManual(rows, headers);
    } else if (reportType === 'storage') {
      const result = await reportService.getStorageUsage({
        page: 1,
        limit: 5000,
      });

      const headers = [
        { id: 'userName', title: 'User Name' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'fileCount', title: 'Total Files' },
        { id: 'storageUsed', title: 'Storage Used (Bytes)' },
        { id: 'storageMB', title: 'Storage (MB)' },
      ];

      const rows = result.data.map((item) => ({
        userName: item.name || 'N/A',
        userEmail: item.email || 'N/A',
        fileCount: item.fileCount || 0,
        storageUsed: item.storageUsed || 0,
        storageMB: ((item.storageUsed || 0) / (1024 * 1024)).toFixed(2),
      }));

      csvData = generateCSVManual(rows, headers);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type specified',
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
