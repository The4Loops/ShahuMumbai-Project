const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/track', analyticsController.trackEvent);
router.get('/analytics/summary', analyticsController.getSummary);
router.get('/analytics/daily', analyticsController.getDailyCounts);
router.get('/analytics/events', analyticsController.getEvents);
router.get('/analytics/sales-report', analyticsController.getSalesReport);

module.exports = router;
