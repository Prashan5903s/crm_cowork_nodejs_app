// Assumes express-validator. If your project uses another library (Joi, etc.),
// keep the same rules and adapt the syntax.
const {
    body,
    validationResult
} = require('express-validator')

const ID_PROOF_TYPES = [
    'Aadhaar',
    'PAN',
    'Driving License',
    'Voter ID',
    'Passport',
    'Other'
]

const handleErrors = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        })
    }

    next()
}

exports.postVisitor = [
    body('visitor_name').trim().notEmpty().withMessage('Visitor name is required'),

    body('visitor_contact')
    .trim()
    .matches(/^[0-9]{7,15}$/)
    .withMessage('Mobile number must be 7-15 digits'),

    body('email')
    .optional({
        checkFalsy: true
    })
    .trim()
    .isEmail()
    .withMessage('Invalid email address'),

    body('company').optional({
        checkFalsy: true
    }).trim(),

    body('purpose').trim().notEmpty().withMessage('Purpose is required'),

    body('host_member').isMongoId().withMessage('Host / member is required'),

    body('checkin_date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Visit date is required (YYYY-MM-DD)'),

    body('checkin_from_time').trim().notEmpty().withMessage('From time is required'),

    body('checkin_to_time').trim().notEmpty().withMessage('To time is required'),

    body('id_proof_type')
    .optional({
        checkFalsy: true
    })
    .isIn(ID_PROOF_TYPES)
    .withMessage('Invalid ID proof type'),

    body('vehicle_number').optional({
        checkFalsy: true
    }).trim(),

    handleErrors
]