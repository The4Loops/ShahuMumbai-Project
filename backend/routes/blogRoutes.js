const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Routes
router.post("/admin/blogs", blogController.createOrUpdateBlog);
router.put("/admin/blogs/:id", blogController.createOrUpdateBlog);
router.delete("/admin/blogs/:id/reset", blogController.resetBlog);
router.get("/admin/blogs/:id", blogController.getBlogById);
router.get("/blogs/drafts", blogController.getUserDrafts);
router.delete("/admin/blogs/:id",blogController.deleteBlog);

router.get('/blogs',blogController.getAllBlogs);
router.get('/user/likes', blogController.getUserLikes);
router.post('/blogs/:id/reviews', blogController.addReview);
router.post('/blogs/:id/reviews/:reviewId/replies',blogController.addReply);
router.post('/blogs/:id/like', blogController.incrementLikes);
router.post('/blogs/:id/view', blogController.incrementViews);
module.exports = router;