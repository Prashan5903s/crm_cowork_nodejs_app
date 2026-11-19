const {
    body
} = require('express-validator');

exports.postCompany = [
    body('email')
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Email must be valid")
    .isLength({
        max: 255
    }).withMessage("Email max length is 255")
    .trim()
    .normalizeEmail(),

    body('phone')
    .notEmpty().withMessage("Phone number is required")
    .isLength({
        min: 10,
        max: 15
    }).withMessage("Phone number must be between 10 and 15 digits")
    .matches(/^[0-9]+$/).withMessage("Phone number must contain only numbers")
    .trim(),

];

exports.postVisitor = [
    body('visitor_contact')
    .notEmpty().withMessage("Visitor number is required")
    .isLength({
        min: 10,
        max: 15
    }).withMessage("Visitor number must be between 10 and 15 digits")
    .matches(/^[0-9]+$/).withMessage("Visitor number must contain only numbers")
    .trim(),
];