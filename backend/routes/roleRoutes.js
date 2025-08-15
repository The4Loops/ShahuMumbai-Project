const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

// Role Management Routes
router.post("/roles", roleController.createRole);
router.get("/roles", roleController.getRoles);
router.put("/roles/:id", roleController.updateRole);
router.delete("/roles/:id", roleController.deleteRole);
router.post("/roles/assign", roleController.assignRoleToUser);

module.exports = router;