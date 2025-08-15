const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

router.post("/menus", menuController.createMenu);
router.get("/menus", menuController.getMenus);
router.get("/menus/dropdown", menuController.getAllMenus);
router.post("/menu-items/roles", menuController.assignRolesToMenuItem);
router.put("/navbar/menus/:id", menuController.updateMenu);
router.delete("/navbar/menus/:id", menuController.deleteMenu);
router.post("/navbar/menu-items", menuController.createMenuItem);
router.put("/navbar/menu-items/:id", menuController.updateMenuItem);
router.delete("/navbar/menu-items/:id", menuController.deleteMenuItem);
router.get("/roletags", menuController.getRoletags);
router.post("/roletags", menuController.assignRolesToMenu);

module.exports = router;