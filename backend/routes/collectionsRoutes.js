// backend/routes/collectionRoutes.js
const express = require("express");
const router = express.Router();
const collectionController = require("../controllers/collectionsController");

// keep the path EXACTLY like this so your client call works:
router.get("/collections/options", collectionController.getCollectionOptions);

module.exports = router;
