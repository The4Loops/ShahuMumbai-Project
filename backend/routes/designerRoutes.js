const express = require('express');
const router = express.Router();
const designerController = require('../controllers/designerController');

// Designer routes (admin protected)
router.post('/designer', designerController.createDesigner);
router.get('/designer', designerController.getAllDesigners);
router.put('/designer/:id', designerController.updateDesigner);
router.delete('/designer/:id', designerController.deleteDesigner);

// ProductDesignerLink routes
router.post('/product-designer-link', designerController.createProductDesignerLink);
router.get('/product-designer-link', designerController.getAllProductDesignerLinks);
router.delete('/product-designer-link/:id', designerController.deleteProductDesignerLink);

module.exports = router;
