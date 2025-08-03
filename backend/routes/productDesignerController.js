const express = require('express');
const router = express.Router();
const designerController = require('../controllers/productDesignerController');


router.post('/product-designer-link', designerController.createProductDesignerLink);
router.get('/product-designer-link', designerController.getAllProductDesignerLinks);
router.delete('/product-designer-link/:id', designerController.deleteProductDesignerLink);


module.exports = router;