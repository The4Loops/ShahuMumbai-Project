const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// ingest events from the frontend
router.post('/track', analyticsController.trackEvent);

// admin reads
router.get('/analytics/summary', analyticsController.getSummary);
router.get('/analytics/daily', analyticsController.getDailyCounts);
router.get('/analytics/events', analyticsController.getEvents);

module.exports = router;
