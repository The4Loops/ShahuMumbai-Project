const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

router.post("/create-user", userController.adminCreateUser);
router.get("/users", userController.getAllUsers);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

module.exports = router;