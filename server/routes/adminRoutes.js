const express = require('express');
const router = express.Router();
const { protect, adminOnly, moderatorOrAdmin } = require('../middleware/authMiddleware');
const { validateAdminNote, validateStatusUpdate } = require('../utils/validators');

// Import controller functions
const {
  getDashboardStats,
  getAllReports,
  getReportDetails,
  updateReportStatus,
  addAdminNote,
  assignReport,
  getUsers,
  getUserDetails,
  updateUserRole,
  deactivateUser,
  getSystemLogs,
  getAnalytics,
  exportReports,
  bulkUpdateReports,
  getModeratorStats
} = require('../controllers/adminController');

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin/Moderator)
router.get('/dashboard', protect, moderatorOrAdmin, getDashboardStats);

// @route   GET /api/admin/reports
// @desc    Get all reports with filters
// @access  Private (Admin/Moderator)
router.get('/reports', protect, moderatorOrAdmin, getAllReports);

// @route   GET /api/admin/reports/:id
// @desc    Get detailed report information
// @access  Private (Admin/Moderator)
router.get('/reports/:id', protect, moderatorOrAdmin, getReportDetails);

// @route   PUT /api/admin/reports/:id/status
// @desc    Update report status
// @access  Private (Admin/Moderator)
router.put('/reports/:id/status', protect, moderatorOrAdmin, validateStatusUpdate, updateReportStatus);

// @route   POST /api/admin/reports/:id/notes
// @desc    Add admin note to report
// @access  Private (Admin/Moderator)
router.post('/reports/:id/notes', protect, moderatorOrAdmin, validateAdminNote, addAdminNote);

// @route   PUT /api/admin/reports/:id/assign
// @desc    Assign report to admin/moderator
// @access  Private (Admin/Moderator)
router.put('/reports/:id/assign', protect, moderatorOrAdmin, assignReport);

// @route   PUT /api/admin/reports/bulk-update
// @desc    Bulk update multiple reports
// @access  Private (Admin only)
router.put('/reports/bulk-update', protect, adminOnly, bulkUpdateReports);

// @route   GET /api/admin/reports/export
// @desc    Export reports data
// @access  Private (Admin only)
router.get('/reports/export', protect, adminOnly, exportReports);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', protect, adminOnly, getUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Private (Admin only)
router.get('/users/:id', protect, adminOnly, getUserDetails);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', protect, adminOnly, updateUserRole);

// @route   PUT /api/admin/users/:id/deactivate
// @desc    Deactivate user account
// @access  Private (Admin only)
router.put('/users/:id/deactivate', protect, adminOnly, deactivateUser);

// @route   GET /api/admin/analytics
// @desc    Get system analytics
// @access  Private (Admin only)
router.get('/analytics', protect, adminOnly, getAnalytics);

// @route   GET /api/admin/logs
// @desc    Get system logs
// @access  Private (Admin only)
router.get('/logs', protect, adminOnly, getSystemLogs);

// @route   GET /api/admin/moderator-stats
// @desc    Get moderator-specific statistics
// @access  Private (Moderator)
router.get('/moderator-stats', protect, moderatorOrAdmin, getModeratorStats);

module.exports = router;