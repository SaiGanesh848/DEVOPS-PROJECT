const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/transfer-history', authorize('admin', 'auditor'), reportController.getTransferHistory);
router.get('/file-access-audit', authorize('admin', 'auditor'), reportController.getFileAccessAudit);
router.get('/expired-shares', authorize('admin', 'auditor'), reportController.getExpiredShares);
router.get('/storage-usage', authorize('admin'), reportController.getStorageUsage);
router.get('/export', authorize('admin', 'auditor'), reportController.exportReport);
router.get('/:reportType/export', authorize('admin', 'auditor'), reportController.exportReport);

module.exports = router;
