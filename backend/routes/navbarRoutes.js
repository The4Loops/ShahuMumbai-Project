const express = require('express');
const router = express.Router();
const navbarController = require('../controllers/navbarController');

router.post("/menus", navbarController.createMenu);
router.get("/menus", navbarController.getMenusWithItems);
router.put("/menus/:id", navbarController.updateMenu);
router.delete("/menus/:id", navbarController.deleteMenu);


router.post("/menu-items", navbarController.createMenuItem);
router.put("/menu-items/:id", navbarController.updateMenuItem);
router.delete("/menu-items/:id", navbarController.deleteMenuItem);

module.exports = router;