const express = require('express');
const router = express.Router();
const validation = require('../validation/Adminvalidation');
const authController = require('../controller/Auth/AuthAPIController');

router.post('/login', validation.loginPostValidation, authController.postAPILogIn);

module.exports = router;
