// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require("../controllers/analyticsController");

// Track events
router.post("/track", ctrl.trackEvent);

// KPI summary for dashboard
router.get("/summary", ctrl.getSummary);

// Daily counts by event name
router.get("/daily", ctrl.getDailyCounts);

// Recent events list
router.get("/events", ctrl.getEvents);

// Sales report (if you’re using it)
router.get("/sales-report", ctrl.getSalesReport);

module.exports = router;