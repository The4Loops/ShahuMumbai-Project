const express = require('express');
const router = express.Router();
const designerController = require('../controllers/designerController');

// Designer routes (admin protected)
router.post('/designer', designerController.createDesigner);
router.get('/designer', designerController.getAllDesigners);
router.put('/designer/:id', designerController.updateDesigner);
router.delete('/designer/:id', designerController.deleteDesigner);

module.exports = router;
