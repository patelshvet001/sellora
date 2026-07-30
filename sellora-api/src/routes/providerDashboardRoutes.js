const express = require('express');
const router = express.Router();
const {
  getProviderStats,
  myServices,
  updateService,
  deleteService,
} = require('../controllers/providerController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/provider/stats', requireAuth, requireRole('SERVICE_PROVIDER'), getProviderStats);
router.get('/provider/services', requireAuth, requireRole('SERVICE_PROVIDER'), myServices);
router.patch('/provider/services/:id', requireAuth, requireRole('SERVICE_PROVIDER'), updateService);
router.delete('/provider/services/:id', requireAuth, requireRole('SERVICE_PROVIDER'), deleteService);

module.exports = router;
