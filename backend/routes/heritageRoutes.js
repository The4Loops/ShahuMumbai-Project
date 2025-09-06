// routes/heritageRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/heritageController");

// List / Read
router.get("/heritage", ctrl.list);
router.get("/heritage/:id", ctrl.getOne);

// Create / Update / Delete
router.post("/heritage", ctrl.create);
router.put("/heritage/:id", ctrl.update);
router.delete("/heritage/:id", ctrl.remove);

module.exports = router;
