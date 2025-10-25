const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.post('/category', categoryController.createCategory);
router.get('/category', categoryController.getAllCategories);
router.get('/category/:id', categoryController.getCategoryById);
router.put('/category/:id', categoryController.updateCategory); // or PUT if you prefer
router.delete('/category/:id', categoryController.deleteCategory);

module.exports = router;
