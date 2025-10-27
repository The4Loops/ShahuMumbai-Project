// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const checkout = require('../controllers/checkoutController');

// create order (both paths supported)
router.post('/checkout', checkout.createOrder);
router.post('/checkout/order', checkout.createOrder); // <- add this line

module.exports = router;
