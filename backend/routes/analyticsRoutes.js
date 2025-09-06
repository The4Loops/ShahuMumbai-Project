// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// ingest events from the frontend
router.post('/track', analyticsController.trackEvent);

// admin reads
router.get('/analytics/summary', analyticsController.getSummary);
router.get('/analytics/daily', analyticsController.getDailyCounts);
router.get('/analytics/events', analyticsController.getEvents);

// NEW: sales report
router.get('/analytics/sales-report', analyticsController.getSalesReport);

module.exports = router;
