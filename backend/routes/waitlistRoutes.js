const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');

router.get('/allWaitListData', waitlistController.getAllWaitlist);
router.get('/waitlist', waitlistController.getWaitlist);
router.post('/waitlist', waitlistController.addToWaitlist);
router.delete('/waitlist/:productId', waitlistController.removeFromWaitlist);

module.exports = router;
