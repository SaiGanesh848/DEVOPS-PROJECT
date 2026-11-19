const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const shareController = require('../controllers/shareController');
const { protect, authorize } = require('../middleware/auth');
const { validateFileShare } = require('../middleware/validators');

// Optional auth helper for public/recipient share token access
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Proceed without user attached
    }
  }
  next();
};

// Token-based access routes
router.get('/access/:token', optionalAuth, shareController.accessShare);
router.get('/token/:token/details', optionalAuth, shareController.getShareDetails);

// Protected routes below
router.use(protect);

// Get list of recipients for selection
router.get('/recipients', authorize('sender', 'admin'), shareController.getRecipients);

// Create share (Sender, Admin)
router.post('/', authorize('sender', 'admin'), validateFileShare, shareController.createShare);

// Get sender's shares
router.get('/my-shares', authorize('sender', 'admin'), shareController.getMyShares);

// Get recipient's shares
router.get('/shared-with-me', authorize('recipient', 'admin'), shareController.getSharedWithMe);

// Revoke share (Sender, Admin)
router.put('/:id/revoke', authorize('sender', 'admin'), shareController.revokeShare);

module.exports = router;
