const express = require('express');
const router = express.Router();
const { protect, adminOnly, moderatorOrAdmin, optionalAuth } = require('../middleware/authMiddleware');
const { validateLearningModule } = require('../utils/validators');

// Import controller functions
const {
  getModules,
  getModuleBySlug,
  createModule,
  updateModule,
  deleteModule,
  getModulesByCategory,
  getPopularModules,
  getRecommendedModules,
  completeModule,
  rateModule,
  getModuleProgress,
  searchModules
} = require('../controllers/moduleController');

// @route   GET /api/modules
// @desc    Get all published learning modules
// @access  Public
router.get('/', optionalAuth, getModules);

// @route   GET /api/modules/search
// @desc    Search learning modules
// @access  Public
router.get('/search', searchModules);

// @route   GET /api/modules/popular
// @desc    Get popular learning modules
// @access  Public
router.get('/popular', getPopularModules);

// @route   GET /api/modules/category/:category
// @desc    Get modules by category
// @access  Public
router.get('/category/:category', getModulesByCategory);

// @route   GET /api/modules/recommended/:moduleId
// @desc    Get recommended modules based on current module
// @access  Public
router.get('/recommended/:moduleId', getRecommendedModules);

// @route   GET /api/modules/progress
// @desc    Get user's module progress
// @access  Private
router.get('/progress', protect, getModuleProgress);

// @route   POST /api/modules
// @desc    Create new learning module
// @access  Private (Admin/Moderator only)
router.post('/', protect, moderatorOrAdmin, validateLearningModule, createModule);

// @route   GET /api/modules/:slug
// @desc    Get learning module by slug
// @access  Public
router.get('/:slug', optionalAuth, getModuleBySlug);

// @route   PUT /api/modules/:id
// @desc    Update learning module
// @access  Private (Admin/Moderator only)
router.put('/:id', protect, moderatorOrAdmin, validateLearningModule, updateModule);

// @route   DELETE /api/modules/:id
// @desc    Delete learning module
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, deleteModule);

// @route   POST /api/modules/:id/complete
// @desc    Mark module as completed
// @access  Private
router.post('/:id/complete', protect, completeModule);

// @route   POST /api/modules/:id/rate
// @desc    Rate a learning module
// @access  Public (can be anonymous)
router.post('/:id/rate', optionalAuth, rateModule);

module.exports = router;