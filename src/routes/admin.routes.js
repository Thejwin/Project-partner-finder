const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// All routes require authentication
router.use(protect);

// Testing route to promote self
router.patch('/make-me-admin', adminController.promoteToAdmin);

// All other routes require admin
router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/reports', adminController.getReports);
router.get('/users', adminController.getAllUsers);
router.get('/projects', adminController.getAllProjects);
router.patch('/reports/:id', adminController.updateReportStatus);
router.patch('/users/:id/ban', adminController.toggleUserBan);
router.delete('/projects/:id', adminController.deleteProject);

module.exports = router;
