const express = require('express');
const router = express.Router();
const categoryController =require('../controllers/categoryController');

router.post('/categories', categoryController.createCategory);        // Create Category (Admin)
router.get('/categories', categoryController.getAllCategories);       // Get All Categories (Public)
router.put('/categories/:id', categoryController.updateCategory);     // Update Category (Admin)
router.delete('/categories/:id', categoryController.deleteCategory); 

module.exports = router;