// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');

// write first so a quick POST test works
router.post('/track', ctrl.trackEvent);

// dashboards
router.get('/summary', ctrl.getSummary);
router.get('/daily', ctrl.getDailyCounts);
router.get('/events', ctrl.getEvents);
router.get('/sales-report', ctrl.getSalesReport);

module.exports = router;
