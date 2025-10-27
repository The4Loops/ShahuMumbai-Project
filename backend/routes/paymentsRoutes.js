// routes/paymentsRoutes.js
const express = require('express');
const router = express.Router();
const payments = require('../controllers/paymentsController');

// Webhook must use raw body
router.post('/webhook', express.raw({ type: '*/*' }), payments.webhook);

// JSON endpoints
router.post('/create-order', express.json(), payments.createRazorpayOrder);
router.post('/verify',       express.json(), payments.verifyPayment);

module.exports = router;
