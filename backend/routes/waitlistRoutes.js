// routes/waitlistRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/waitlistController');

router.get('/waitlist', ctrl.getWaitlist);
router.post('/waitlist', ctrl.addToWaitlist);
router.delete('/waitlist/:productId', ctrl.removeFromWaitlist);

// 🔧 FIX THIS LINE
router.post('/waitlist/deposit-order', ctrl.createWaitlistDepositOrder);

// admin
router.get('/admin/waitlist', ctrl.getAllWaitlist);

module.exports = router;
