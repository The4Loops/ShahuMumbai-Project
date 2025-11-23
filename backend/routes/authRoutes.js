const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/me', authController.me);
router.post('/logout', authController.logout);
router.post('/register/send-otp', authController.sendOtp);
router.post('/register/verify', authController.verifyOtpAndRegister);
router.post('/login', authController.login);
router.post('/ssoLogin',authController.ssoLogin);
router.post('/reset-password/send-otp', authController.sendResetPasswordOtp);
router.post('/reset-password/verify', authController.verifyResetPasswordOtp);


module.exports = router;
