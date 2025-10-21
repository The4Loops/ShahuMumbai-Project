const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.post("/reviews", reviewController.createReview);
router.get("/reviews", reviewController.getAllReviews);
router.get("/reviews/:id", reviewController.getReviewsByProductId);
router.put("/reviews/:id", reviewController.updateReview);
router.delete("/reviews/:id", reviewController.deleteReview);

module.exports = router;