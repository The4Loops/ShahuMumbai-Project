const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

router.post("/users", userController.adminCreateUser);
router.get("/users", userController.getAllUsers);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.put("/users/profile",userController.updateUserProfile);
router.get("/users/profile",userController.getUserProfile);

module.exports = router;