// backend/routes/collectionRoutes.js
const express = require("express");
const router = express.Router();
const collectionController = require("../controllers/collectionsController");

router.get('/admin/collections', collectionController.listCollections); // List all with optional filters
router.post('/admin/collections', collectionController.createCollection); // Create new
router.get('/admin/collections/:id', collectionController.getCollection); // Get one by ID
router.put('/admin/collections/:id', collectionController.updateCollection); // Update by ID
router.delete('/admin/collections/:id', collectionController.deleteCollection); // Delete by ID

module.exports = router;
