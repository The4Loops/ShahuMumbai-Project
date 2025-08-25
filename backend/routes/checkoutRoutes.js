
const router = require('express').Router();
const { createOrder } = require('../controllers/checkoutController');

router.post('/checkout', createOrder);

module.exports = router;
