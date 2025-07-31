const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register/send-otp', authController.sendOtp);
router.post('/register/verify', authController.verifyOtpAndRegister);
router.post('/login', authController.login);
router.post('/sso-login', authController.ssoLogin);

module.exports = router;
