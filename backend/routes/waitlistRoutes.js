const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');

router.get('/', waitlistController.getWaitlist);
router.post('/', waitlistController.addToWaitlist);
router.delete('/:productId', waitlistController.removeFromWaitlist);

module.exports = router;
