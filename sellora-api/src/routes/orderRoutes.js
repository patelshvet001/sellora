const express = require('express');
const router = express.Router();
const {
  createOrder,
  listMyOrders,
  getOrder,
  listVendorOrders,
  updateOrderStatus,
  listAvailableDeliveries,
  listMyDeliveries,
  acceptDelivery,
  getDeliveryStats,
} = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Customer checkout + history
router.post('/orders', requireAuth, requireRole('CUSTOMER'), createOrder);
router.get('/orders/mine', requireAuth, requireRole('CUSTOMER'), listMyOrders);
router.get('/orders/:id', requireAuth, getOrder);
router.patch('/orders/:id/status', requireAuth, requireRole('VENDOR', 'DELIVERY_PARTNER', 'ADMIN'), updateOrderStatus);

// Vendor order management
router.get('/vendor/orders', requireAuth, requireRole('VENDOR'), listVendorOrders);

// Delivery partner order management
router.get('/delivery/stats', requireAuth, requireRole('DELIVERY_PARTNER'), getDeliveryStats);
router.get('/delivery/orders/available', requireAuth, requireRole('DELIVERY_PARTNER'), listAvailableDeliveries);
router.get('/delivery/orders/mine', requireAuth, requireRole('DELIVERY_PARTNER'), listMyDeliveries);
router.post('/delivery/orders/:id/accept', requireAuth, requireRole('DELIVERY_PARTNER'), acceptDelivery);

module.exports = router;
