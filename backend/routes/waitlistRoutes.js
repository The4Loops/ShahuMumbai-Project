// routes/waitlistRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/waitlistController');

router.get('/waitlist', ctrl.getWaitlist);
router.post('/waitlist', ctrl.addToWaitlist);
router.delete('/waitlist/:productId', ctrl.removeFromWaitlist);
router.post('/waitlist/deposit/order', ctrl.createWaitlistDepositOrder);

// admin
router.get('/admin/waitlist', ctrl.getAllWaitlist);
// /admin/waitlist/:id/confirm and delete routes already in your admin controller / routes

module.exports = router;
