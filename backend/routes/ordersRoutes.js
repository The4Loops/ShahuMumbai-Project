// routes/ordersRoutes.js
const express = require('express');
const router = express.Router();
const orders = require('../controllers/ordersController');

router.get('/orders', orders.listOrders);
router.patch('/orders/:orderNumber/status', orders.updateFulfillmentStatus);

module.exports = router;
