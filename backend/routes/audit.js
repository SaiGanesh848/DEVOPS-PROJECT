const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('auditor', 'admin'));

router.get('/', auditController.getAuditLogs);
router.get('/stats', auditController.getAuditStats);
router.get('/failed-access', auditController.getFailedAccesses);
router.get('/failed-accesses', auditController.getFailedAccesses);
router.get('/revocations', auditController.getLinkRevocations);
router.get('/link-revocations', auditController.getLinkRevocations);

module.exports = router;
