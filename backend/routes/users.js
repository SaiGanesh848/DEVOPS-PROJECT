const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validators');

// All user management routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.put('/:id', validateUserUpdate, userController.updateUser);
router.patch('/:id/toggle-status', userController.toggleUserStatus);
router.put('/:id/toggle-status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
