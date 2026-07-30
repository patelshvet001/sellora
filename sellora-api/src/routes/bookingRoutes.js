const express = require('express');
const router = express.Router();
const {
  createBooking,
  listMyBookings,
  listProviderBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/bookings', requireAuth, requireRole('CUSTOMER'), createBooking);
router.get('/bookings/mine', requireAuth, requireRole('CUSTOMER'), listMyBookings);
router.patch('/bookings/:id/status', requireAuth, requireRole('SERVICE_PROVIDER', 'ADMIN'), updateBookingStatus);

router.get('/provider/bookings', requireAuth, requireRole('SERVICE_PROVIDER'), listProviderBookings);

module.exports = router;
