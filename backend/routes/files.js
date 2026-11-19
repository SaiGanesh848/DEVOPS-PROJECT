const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Upload file (Sender, Admin)
router.post('/upload', authorize('sender', 'admin'), upload.single('file'), fileController.uploadFile);

// Get my files (Sender)
router.get('/my-files', authorize('sender', 'admin'), fileController.getMyFiles);

// Get all files (Admin only)
router.get('/all', authorize('admin'), fileController.getAllFiles);
router.get('/', authorize('admin'), fileController.getAllFiles);

// Get file by ID
router.get('/:id', fileController.getFileById);

// Direct download by ID (Owner or Admin)
router.get('/download/:id', fileController.downloadFile);
router.get('/:id/download', fileController.downloadFile);

// Delete file (Owner or Admin)
router.delete('/:id', authorize('sender', 'admin'), fileController.deleteFile);

module.exports = router;
