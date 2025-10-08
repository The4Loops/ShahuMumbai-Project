const express = require('express');
const router = express.Router();
const payments = require('../controllers/paymentsController');

// IMPORTANT: mount webhook with raw body at the router level
router.post(
  '/webhook',
  express.raw({ type: '*/*' }), // provides req.rawBody Buffer
  payments.webhook
);

// Normal JSON endpoints
router.post('/create-order', express.json(), payments.createRazorpayOrder);
router.post('/verify',       express.json(), payments.verifyPayment);

module.exports = router;
