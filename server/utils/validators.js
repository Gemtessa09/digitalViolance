const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  validate
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

// Report submission validation
const validateReport = [
  body('incidentType')
    .isArray({ min: 1 })
    .withMessage('At least one incident type must be selected'),
  
  body('incident.description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('incident.dateOccurred')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('incident.platform')
    .isArray({ min: 1 })
    .withMessage('At least one platform must be selected'),
  
  validate
];

// Learning module validation
const validateLearningModule = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .isIn([
      'digital-safety-basics',
      'social-media-privacy',
      'online-harassment',
      'child-protection',
      'password-security',
      'safe-communication',
      'reporting-abuse',
      'legal-rights',
      'emotional-support',
      'prevention-strategies'
    ])
    .withMessage('Invalid category'),
  
  body('estimatedTime')
    .isInt({ min: 1 })
    .withMessage('Estimated time must be at least 1 minute'),
  
  body('content.introduction')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Introduction must be at least 10 characters'),
  
  validate
];

// Admin note validation
const validateAdminNote = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters'),
  
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean'),
  
  validate
];

// Status update validation
const validateStatusUpdate = [
  body('status')
    .isIn(['pending', 'under-review', 'investigating', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Note cannot exceed 1000 characters'),
  
  validate
];

// Contact form validation
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  
  validate
];

// Password reset validation
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  validate
];

// New password validation
const validateNewPassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  validate
];

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

// Check if string contains potentially harmful content
const containsHarmfulContent = (text) => {
  const harmfulPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return harmfulPatterns.some(pattern => pattern.test(text));
};

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateReport,
  validateLearningModule,
  validateAdminNote,
  validateStatusUpdate,
  validateContact,
  validatePasswordReset,
  validateNewPassword,
  sanitizeInput,
  containsHarmfulContent
};