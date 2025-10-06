const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

// Menu operations
router.get("/menus", menuController.getMenus);
router.get("/menus/dropdown", menuController.getAllMenus);
router.post("/menus", menuController.createMenu);
router.put("/menus/:id", menuController.updateMenu);
router.delete("/menus/:id", menuController.deleteMenu);

// Menu item operations
router.post("/menu-items", menuController.createMenuItem);
router.put("/menu-items/:id", menuController.updateMenuItem);
router.delete("/menu-items/:id", menuController.deleteMenuItem);

// Role assignments
router.post("/menu-roles", menuController.assignRolesToMenu);
router.post("/menu-item-roles", menuController.assignRolesToMenuItem);

module.exports = router;