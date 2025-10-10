// backend/routes/cartRoutes.js
const express = require('express');
const ctrl = require('../controllers/cartController');

const router = express.Router();

router.post('/cart', ctrl.addToCart);
router.get('/cart', ctrl.getCartItems);
router.get('/cartById', ctrl.getCartItemsByUserId);
router.put('/cart/:id', ctrl.updateCartItem);
router.delete('/cart/:id', ctrl.deleteCartItem);
router.delete('/cart/clear', ctrl.clearCart);

module.exports = router;
