const { body } = require('express-validator')

exports.postParcelValidation = [
  body('floor_id')
    .notEmpty()
    .withMessage('Floor ID is required')
    .isMongoId()
    .withMessage('Invalid Floor ID'),

  body('resident_id')
    .notEmpty()
    .withMessage('Resident ID is required')
    .isMongoId()
    .withMessage('Invalid Resident ID'),

  body('courier_company').notEmpty().withMessage('Courier company is required'),

  body('product_name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 255 })
    .withMessage('Product name must not exceed 255 characters'),

  body('tracking_number')
    .trim()
    .notEmpty()
    .withMessage('Tracking number is required')
    .isLength({ max: 100 })
    .withMessage('Tracking number must not exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
]
