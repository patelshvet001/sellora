const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getMyProfile, updateMyProfile, uploadAvatar } = require('../controllers/profileController');
const upload = require('../middleware/upload');

// All user routes require authentication
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);
router.post('/me/avatar', requireAuth, upload.single('avatar'), uploadAvatar);

module.exports = router;
