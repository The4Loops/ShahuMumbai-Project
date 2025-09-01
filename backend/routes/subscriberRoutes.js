const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');

router.get("/subscriber", subscriberController.getSubscribeUser);
router.delete("/subscriber/:id", subscriberController.deleteUser);
router.post("/sendSubscriberMail",subscriberController.sendSubscriberMail);
module.exports = router;