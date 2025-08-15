const express = require('express');
const router = express.Router();
const navbarController = require('../controllers/navbarController');

router.get("/menus", navbarController.getMenusWithItems);

module.exports = router;