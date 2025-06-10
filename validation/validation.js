const { check } = require('express-validator');

exports.registeredValidator = [
    check('name', 'Name is required').not().isEmpty(),
    check('name', 'Name must be between 3 to 15 characters')
        .isLength({ min: 3, max: 15 }),

    check('email', 'Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .isLength({ max: 25 })
        .withMessage('Email must not exceed 25 characters')
        .normalizeEmail({ gmail_remove_dots: true }),
    
    check('mobile', 'mobile no. must be of 10 digits').isLength({
        min: 10,
        max:10
    })
]