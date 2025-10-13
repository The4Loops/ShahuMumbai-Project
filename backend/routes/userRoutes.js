const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const Orders = require('../controllers/ordersController');

router.post("/users", userController.adminCreateUser);
router.get("/users", userController.getAllUsers);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.put("/edit-profile",userController.updateUserProfile);
router.get("/users/profile",userController.getUserProfile);
router.get('/orders', Orders.getUserOrders);

module.exports = router;