// routes/collectionsRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/collectionsController");

// Consistent with app.use('/api', …)
router.get("/collections", ctrl.listCollections);
router.get("/collections/:id", ctrl.getCollection);
router.post("/collections", ctrl.createCollection);
router.put("/collections/:id", ctrl.updateCollection);
router.delete("/collections/:id", ctrl.deleteCollection);

module.exports = router;
