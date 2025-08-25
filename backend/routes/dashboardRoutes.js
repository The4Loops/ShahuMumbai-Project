const express = require('express');
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get('/dashboard/summary', dashboardController.getSummary);
router.get('/dashboard/sales', dashboardController.getSales);
router.get('/dashboard/top-products', dashboardController.getTopProducts);
router.get('/dashboard/recent-orders', dashboardController.getRecentOrders);

module.exports = router;