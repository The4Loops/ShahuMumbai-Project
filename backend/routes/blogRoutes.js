const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Create / Update
router.post('/admin/blogs', blogController.createOrUpdateBlog);
router.put('/admin/blogs/:id', blogController.createOrUpdateBlog);

// Reset draft
router.patch('/blogs/:id/reset', blogController.resetBlog);

// Get one 
router.get('/admin/blogs/:id', blogController.getBlogById);

// Drafts
router.get('/blogs/drafts', blogController.getUserDrafts);

// All published + reviews
router.get('/blogs', blogController.getAllBlogs);

// Likes & views
router.get('/user/likes', blogController.getUserLikes);
router.post('/blogs/:id/like', blogController.incrementLikes);
router.post('/blogs/:id/view', blogController.incrementViews);

// Reviews
router.post('/blogs/:id/reviews', blogController.addReview);
router.post('/blogs/:id/reviews/:reviewId/replies', blogController.addReply);

// Delete
router.delete('/blogs/:id', blogController.deleteBlog);

module.exports = router;
