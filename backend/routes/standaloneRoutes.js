const router = require('express').Router();
const standaloneController = require('../controllers/standaloneController');

router.post('/public/subscribe', standaloneController.subscribeAndWelcome);

module.exports = router;
