const express = require('express');
const router = express.Router();
const categoryController =require('../controllers/categoryController');

router.post('/category', categoryController.createCategory);        // Create Category (Admin)
router.get('/category', categoryController.getAllCategories);       // Get All Categories (Public)
router.put('/category/:id', categoryController.updateCategory);     // Update Category (Admin)
router.delete('/category/:id', categoryController.deleteCategory); 
router.get('/category/:id', categoryController.getCategoryById);

module.exports = router;