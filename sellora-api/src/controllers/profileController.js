const prisma = require('../lib/prisma');
const { updateProfileSchema } = require('../lib/validators');
const { sendEmailAddedNotification } = require('../lib/mailer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// GET /api/users/me — full profile with role-specific data and addresses
async function getMyProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
      vendorProfile: true,
      providerProfile: true,
      deliveryProfile: true,
      wallet: true,
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
}

// PATCH /api/users/me — update profile fields
async function updateMyProfile(req, res) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const data = parsed.data;

  // If email is being updated, make sure it's not already in use by another account
  if (data.email !== undefined && data.email !== '') {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
  }

  // Build update object — only include provided fields
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined && data.email !== '') updateData.email = data.email;
  if (data.phone !== undefined && data.phone !== '') updateData.phone = data.phone;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
    },
  });

  // Send email notification when the user adds or updates their email
  if (data.email !== undefined && data.email !== '') {
    try {
      await sendEmailAddedNotification(user.email, user.name);
    } catch (err) {
      console.error('Failed to send email-added notification:', err.message);
      // Don't fail the profile update just because the notification email didn't send
    }
  }

  return res.json({ message: 'Profile updated', user });
}

// POST /api/users/me/avatar — upload profile image
async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  // Store relative URL path
  const avatarUrl = `/uploads/${req.file.filename}`;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
    },
  });

  return res.json({ message: 'Avatar uploaded', user });
}

module.exports = { getMyProfile, updateMyProfile, uploadAvatar };
