// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.post('/checkout/order', checkoutController.createOrder);

module.exports = router;
