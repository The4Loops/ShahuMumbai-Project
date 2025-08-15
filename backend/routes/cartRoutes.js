const express = require('express');
const router = express.Router();
const cartController= require('../controllers/cartController');

router.post('/cart', cartController.addToCart);
router.get('/cart', cartController.getCartItems);
router.get('/cartById', cartController.getCartItemsByUserId);
router.put('/cart/:id', cartController.updateCartItem);
router.delete('/cart/:id', cartController.deleteCartItem);
router.delete('/cart/clear', cartController.clearCart);

module.exports = router;