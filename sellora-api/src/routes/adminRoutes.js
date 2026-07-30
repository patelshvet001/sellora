const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  listUsers,
  getUser,
  updateUser,
  setUserActive,
  listVendors,
  approveVendor,
  listProviders,
  approveProvider,
  listDeliveryPartners,
  approveDeliveryPartner,
  listAllOrders,
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('ADMIN'));

router.get('/admin/stats', getAdminStats);
router.get('/admin/users', listUsers);
router.get('/admin/users/:id', getUser);
router.patch('/admin/users/:id', updateUser);
router.patch('/admin/users/:id/status', setUserActive);
router.get('/admin/vendors', listVendors);
router.patch('/admin/vendors/:id/approve', approveVendor);
router.get('/admin/providers', listProviders);
router.patch('/admin/providers/:id/approve', approveProvider);
router.get('/admin/delivery-partners', listDeliveryPartners);
router.patch('/admin/delivery-partners/:id/approve', approveDeliveryPartner);
router.get('/admin/orders', listAllOrders);

module.exports = router;
