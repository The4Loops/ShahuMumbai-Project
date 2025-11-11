  const express = require('express');
  const router = express.Router();
  const Orders = require('../controllers/ordersController');

  router.get('/user',Orders.getUserOrders);
  router.get('/listOrders', Orders.listOrders);
  router.patch('/:orderNumber/status', Orders.updateFulfillmentStatus);
  router.put('/:orderNumber/tracking',  Orders.updateTracking);

  module.exports = router;
