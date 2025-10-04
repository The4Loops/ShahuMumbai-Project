const router = require('express').Router();
const standaloneController = require('../controllers/standaloneController');

router.post('/public/subscribe', standaloneController.subscribeAndWelcome);
router.post('/public/login', standaloneController.login);
router.get('/public/invite',standaloneController.getInviteRequests);

module.exports = router;
