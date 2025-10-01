const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// KPIs + Top products (windowed)
router.get('/dashboard/summary', dashboardController.getSummary);

// Daily series: metric=orders|revenue
router.get('/dashboard/sales', dashboardController.getSales);

// Top products (standalone)
router.get('/dashboard/top-products', dashboardController.getTopProducts);

// Recent orders
router.get('/dashboard/recent-orders', dashboardController.getRecentOrders);

module.exports = router;
