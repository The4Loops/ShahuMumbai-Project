const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

router.post('/wishlist', wishlistController.addToWishlist);
router.get('/wishlist', wishlistController.getWishlist);
router.delete('/wishlist/:id', wishlistController.removeFromWishlist);
router.delete('/wishlist', wishlistController.clearWishlist);

module.exports = router;