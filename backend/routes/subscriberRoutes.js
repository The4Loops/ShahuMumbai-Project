const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');

router.get("/subscriber", subscriberController.getNewsletterUsers);
router.delete("/subscriber/:id", subscriberController.deleteUser);

module.exports = router;