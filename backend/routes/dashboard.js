const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);
router.get('/sender', authorize('sender', 'admin'), dashboardController.getSenderDashboard);
router.get('/recipient', authorize('recipient', 'admin'), dashboardController.getRecipientDashboard);
router.get('/auditor', authorize('auditor', 'admin'), dashboardController.getAuditorDashboard);

module.exports = router;
