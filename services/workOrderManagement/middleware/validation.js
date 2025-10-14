const { body, param, query } = require('express-validator');

// Order validation rules
const createOrderValidation = [
  body('surveyDate')
    .isISO8601()
    .withMessage('Survey date must be a valid date'),

  body('technician')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Technician name is required and must be between 1-100 characters'),

  body('spaceName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Space name/ID is required and must be between 1-100 characters'),

  body('building')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Building is required and must be between 1-50 characters'),

  body('locationDescription')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Location description is required and cannot exceed 500 characters'),

  body('confinedSpaceDescription')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Confined space description cannot exceed 1000 characters'),

  body('isConfinedSpace')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Confined space classification must be boolean or null');
    }),

  body('permitRequired')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Permit required must be boolean or null');
    }),

  body('entryRequirements')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Entry requirements cannot exceed 1000 characters'),

  body('atmosphericHazard')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Atmospheric hazard must be boolean or null');
    }),

  body('atmosphericHazardDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Atmospheric hazard description cannot exceed 500 characters'),

  body('engulfmentHazard')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Engulfment hazard must be boolean or null');
    }),

  body('engulfmentHazardDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Engulfment hazard description cannot exceed 500 characters'),

  body('configurationHazard')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Configuration hazard must be boolean or null');
    }),

  body('configurationHazardDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Configuration hazard description cannot exceed 500 characters'),

  body('otherRecognizedHazards')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Other recognized hazards must be boolean or null');
    }),

  body('otherHazardsDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Other hazards description cannot exceed 500 characters'),

  body('ppeRequired')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('PPE required must be boolean or null');
    }),

  body('ppeList')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('PPE list cannot exceed 1000 characters'),

  body('forcedAirVentilationSufficient')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Forced air ventilation sufficient must be boolean or null');
    }),

  body('dedicatedAirMonitor')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Dedicated air monitor must be boolean or null');
    }),

  body('warningSignPosted')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Warning sign posted must be boolean or null');
    }),

  body('otherPeopleWorkingNearSpace')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Other people working near space must be boolean or null');
    }),

  body('canOthersSeeIntoSpace')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Can others see into space must be boolean or null');
    }),

  body('contractorsEnterSpace')
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
      }
      throw new Error('Contractors enter space must be boolean or null');
    }),

  body('numberOfEntryPoints')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Number of entry points must be between 0 and 20'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),

  body('pictures')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Cannot have more than 10 pictures'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),

  body('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'in-progress', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Status must be valid'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      if (!tags.every(tag => typeof tag === 'string' && tag.trim().length <= 30)) {
        throw new Error('Each tag must be a string with max 30 characters');
      }
      return true;
    })
];

// Update validation (similar to create but all fields optional)
const updateOrderValidation = [
  body('dateOfSurvey')
    .optional()
    .isISO8601()
    .withMessage('Date of survey must be a valid date'),

  body('surveyors')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one surveyor must be specified'),

  body('confinedSpaceNameOrId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Confined space name/ID must be between 1-100 characters'),

  body('building')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Building must be between 1-50 characters'),

  body('locationDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location description cannot exceed 500 characters'),

  body('confinedSpaceDescription')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Confined space description cannot exceed 1000 characters'),

  body('confinedSpace')
    .optional()
    .isBoolean()
    .withMessage('Confined space classification must be boolean'),

  body('permitRequired')
    .optional()
    .isBoolean()
    .withMessage('Permit required must be boolean'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),

  body('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'in-progress', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Status must be valid'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      if (!tags.every(tag => typeof tag === 'string' && tag.trim().length <= 30)) {
        throw new Error('Each tag must be a string with max 30 characters');
      }
      return true;
    })
];

// ID parameter validation
const orderIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Order ID is required')
    .custom((value) => {
      // Accept MongoDB ObjectId, UUID, or numeric string
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const numericRegex = /^\d{1,10}$/;
      
      if (!objectIdRegex.test(value) && !uuidRegex.test(value) && !numericRegex.test(value)) {
        throw new Error('Invalid order ID format');
      }
      return true;
    })
];

// Status update validation
const statusUpdateValidation = [
  body('status')
    .isIn(['draft', 'pending', 'approved', 'in-progress', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Status must be valid'),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters')
];

// Query validation for filtering
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'in-progress', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Status must be valid'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be valid'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'dateOfSurvey', 'priority', 'status', 'building'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1-100 characters'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date')
];

// Bulk operations validation
const bulkUpdateValidation = [
  body('orderIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Order IDs must be an array with 1-50 items'),

  body('status')
    .isIn(['draft', 'pending', 'approved', 'in-progress', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Status must be valid'),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters')
];

module.exports = {
  createOrderValidation,
  updateOrderValidation,
  orderIdValidation,
  statusUpdateValidation,
  queryValidation,
  bulkUpdateValidation
};