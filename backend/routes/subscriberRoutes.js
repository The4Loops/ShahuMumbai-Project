const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');

router.get("/subscriber", subscriberController.getSubscribeUser);
router.get('/newsletter/status', subscriberController.getNewsletterStatus);
router.post('/newsletter/optout', subscriberController.optOutNewsletter);
router.delete("/subscriber/:id", subscriberController.deleteUser);
router.post("/sendSubscriberMail",subscriberController.sendSubscriberMail);
router.post("/sendNewsletterMail",subscriberController.sendNewsletterMail);


module.exports = router;