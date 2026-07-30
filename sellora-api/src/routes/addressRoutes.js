const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { listAddresses, createAddress, updateAddress, deleteAddress } = require('../controllers/addressController');

// All address routes require authentication
router.get('/', requireAuth, listAddresses);
router.post('/', requireAuth, createAddress);
router.patch('/:id', requireAuth, updateAddress);
router.delete('/:id', requireAuth, deleteAddress);

module.exports = router;

