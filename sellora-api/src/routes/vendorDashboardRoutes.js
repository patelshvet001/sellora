const express = require('express');
const router = express.Router();
const { getVendorStats } = require('../controllers/vendorController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/vendor/stats', requireAuth, requireRole('VENDOR'), getVendorStats);

module.exports = router;
