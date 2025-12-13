const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { validateReport } = require('../utils/validators');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/evidence/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, videos, and documents
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// Import controller functions
const {
  submitReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  addEvidence,
  getReportStatus,
  getPublicStatistics,
  searchReports
} = require('../controllers/reportController');

// @route   POST /api/reports
// @desc    Submit new report
// @access  Public (can be anonymous)
router.post('/', optionalAuth, upload.array('evidence', 10), validateReport, submitReport);

// @route   GET /api/reports
// @desc    Get all reports (admin/moderator only)
// @access  Private
router.get('/', protect, getReports);

// @route   GET /api/reports/search
// @desc    Search reports
// @access  Private
router.get('/search', protect, searchReports);

// @route   GET /api/reports/statistics
// @desc    Get public statistics
// @access  Public
router.get('/statistics', getPublicStatistics);

// @route   GET /api/reports/status/:caseId
// @desc    Get report status by case ID
// @access  Public
router.get('/status/:caseId', getReportStatus);

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', protect, getReportById);

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', protect, updateReport);

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private
router.delete('/:id', protect, deleteReport);

// @route   POST /api/reports/:id/evidence
// @desc    Add evidence to existing report
// @access  Public (with case ID verification)
router.post('/:id/evidence', upload.array('evidence', 5), addEvidence);

module.exports = router;