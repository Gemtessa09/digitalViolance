const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { validateContact } = require('../utils/validators');

// Import controller functions
const {
  getEmergencyContacts,
  getHotlines,
  getLegalResources,
  getCounselingServices,
  getTechnicalSupport,
  submitContactForm,
  getSupportCategories,
  getResourcesByLocation,
  reportEmergency,
  getFrequentlyAskedQuestions
} = require('../controllers/supportController');

// @route   GET /api/support/emergency
// @desc    Get emergency contacts and hotlines
// @access  Public
router.get('/emergency', getEmergencyContacts);

// @route   POST /api/support/emergency
// @desc    Report emergency situation
// @access  Public
router.post('/emergency', reportEmergency);

// @route   GET /api/support/hotlines
// @desc    Get crisis hotlines by category
// @access  Public
router.get('/hotlines', getHotlines);

// @route   GET /api/support/legal
// @desc    Get legal resources and services
// @access  Public
router.get('/legal', getLegalResources);

// @route   GET /api/support/counseling
// @desc    Get counseling and mental health services
// @access  Public
router.get('/counseling', getCounselingServices);

// @route   GET /api/support/technical
// @desc    Get technical support resources
// @access  Public
router.get('/technical', getTechnicalSupport);

// @route   GET /api/support/categories
// @desc    Get all support categories
// @access  Public
router.get('/categories', getSupportCategories);

// @route   GET /api/support/location/:country
// @desc    Get resources by location
// @access  Public
router.get('/location/:country', getResourcesByLocation);

// @route   GET /api/support/faq
// @desc    Get frequently asked questions
// @access  Public
router.get('/faq', getFrequentlyAskedQuestions);

// @route   POST /api/support/contact
// @desc    Submit contact form
// @access  Public
router.post('/contact', validateContact, submitContactForm);

module.exports = router;