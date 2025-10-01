const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.patch('/categories/:id', categoryController.updateCategory); // or PUT if you prefer
router.delete('/categories/:id', categoryController.deleteCategory);

module.exports = router;
