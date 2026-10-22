const express = require('express');
const router = express.Router();
const { createReview, checkEligibility } = require('../controllers/reviewController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/reviews/eligibility', requireAuth, requireRole('CUSTOMER'), checkEligibility);
router.post('/reviews', requireAuth, requireRole('CUSTOMER'), createReview);

module.exports = router;
