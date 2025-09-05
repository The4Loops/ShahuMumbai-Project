const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');

// Create Razorpay Order for a given order_number
router.post('/create-order', paymentsController.createRazorpayOrder);

// Verify (client → server after successful checkout)
router.post('/verify', paymentsController.verifyPayment);

// Webhook (Razorpay → server) — raw body
function rawBodySaver(req, res, buf) { req.rawBody = buf; }
const rawJson = express.raw({ type: 'application/json', verify: rawBodySaver });
router.post('/webhook', rawJson, paymentsController.webhook);

module.exports = router;
