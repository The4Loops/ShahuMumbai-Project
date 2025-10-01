const express = require('express');
const router = express.Router();
const collectionsController = require('../controllers/collectionsController');

// List (q, status, is_active, limit, offset)
router.get('/collections', collectionsController.listCollections);

// Get one (by UUID)
router.get('/collections/:id', collectionsController.getCollection);

// Create (expects title, slug, status, categoryids[])
router.post('/collections', collectionsController.createCollection);

// Update (fields and/or categoryids[])
router.put('/collections/:id', collectionsController.updateCollection);

// Delete
router.delete('/collections/:id', collectionsController.deleteCollection);

module.exports = router;
