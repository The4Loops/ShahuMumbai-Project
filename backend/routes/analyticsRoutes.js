// routes/analytics.routes.js
const express = require('express');
const ctrl = require('../controllers/analytics.controller');
const { attachDb } = require('../middleware/db');
const router = express.Router();

router.use(attachDb); 

router.post('/track', ctrl.trackEvent);
router.get('/analytics/summary', ctrl.getSummary);
router.get('/analytics/daily', ctrl.getDailyCounts);
router.get('/analytics/events', ctrl.getEvents);
router.get('/analytics/sales-report', ctrl.getSalesReport);

module.exports = router;
