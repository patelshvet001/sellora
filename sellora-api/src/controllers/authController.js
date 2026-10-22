const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { sendOtpEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail } = require('../lib/mailer');
const { signToken } = require('../lib/jwt');
const {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../lib/validators');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function otpExpiryDate() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

// POST /api/auth/register
// Handles CUSTOMER, VENDOR, DELIVERY_PARTNER — shape decided by `role` in body
async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const otp = generateOtp();

  // Create the user and their role-specific profile atomically — if the
  // profile insert fails, the user insert is rolled back too, so we never
  // end up with an orphaned account that has no vendor/delivery/provider profile.
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: hashedPassword,
        role: data.role,
        otpCode: otp,
        otpExpiry: otpExpiryDate(),
      },
    });

    if (data.role === 'VENDOR') {
      await tx.vendorProfile.create({
        data: {
          userId: createdUser.id,
          storeName: data.storeName,
          category: data.category,
          gstNumber: data.gstNumber || null,
          address: data.address,
          city: data.city,
          pincode: data.pincode,
        },
      });
    }

    if (data.role === 'DELIVERY_PARTNER') {
      await tx.deliveryPartnerProfile.create({
        data: {
          userId: createdUser.id,
          vehicleType: data.vehicleType,
          vehicleNumber: data.vehicleNumber,
          licenseNumber: data.licenseNumber,
          city: data.city,
        },
      });
    }

    if (data.role === 'SERVICE_PROVIDER') {
      await tx.serviceProviderProfile.create({
        data: {
          userId: createdUser.id,
          businessName: data.businessName,
          category: data.category,
          city: data.city,
          pincode: data.pincode,
          bio: data.bio || null,
        },
      });
    }

    return createdUser;
  });

  try {
    await sendOtpEmail(user.email, user.name, otp);
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    // Don't fail registration just because email didn't send — allow resend later
  }

  return res.status(201).json({
    message: 'Registered. Check your email for the OTP.',
    email: user.email,
  });
}

// POST /api/auth/verify-otp
async function verifyOtp(req, res) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, otp } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (user.isVerified) return res.status(400).json({ error: 'Account already verified' });

  if (!user.otpCode || !user.otpExpiry) {
    return res.status(400).json({ error: 'No OTP pending. Please request a new one.' });
  }
  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }
  const MAX_OTP_ATTEMPTS = 5;
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    // Invalidate the code entirely so the only way forward is requesting a new one
    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiry: null },
    });
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }
  if (user.otpCode !== otp) {
    await prisma.user.update({
      where: { email },
      data: { otpAttempts: { increment: 1 } },
    });
    return res.status(400).json({ error: 'Incorrect OTP' });
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { isVerified: true, otpCode: null, otpExpiry: null, otpAttempts: 0 },
  });

  const token = signToken(updated);
  return res.json({
    message: 'Account verified',
    token,
    user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
  });
}

// POST /api/auth/resend-otp
async function resendOtp(req, res) {
  const parsed = resendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (user.isVerified) return res.status(400).json({ error: 'Account already verified' });

  const otp = generateOtp();
  await prisma.user.update({
    where: { email },
    data: { otpCode: otp, otpExpiry: otpExpiryDate(), otpAttempts: 0 },
  });

  await sendOtpEmail(user.email, user.name, otp);
  return res.json({ message: 'New OTP sent' });
}

// POST /api/auth/login
async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });

  if (!user.isActive) {
    return res.status(403).json({ error: 'This account has been deactivated. Contact support for help.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      error: 'Account not verified',
      needsVerification: true,
      email: user.email,
    });
  }

  const token = signToken(user);
  return res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}


// GET /api/auth/me  (requires auth middleware)
async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, isVerified: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
}

function generateResetToken() {
  // Non-guessable token
  return require('crypto').randomBytes(32).toString('hex');
}

function resetExpiryDate() {
  return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // For security: always return 200 to avoid account enumeration
  if (!user) {
    return res.json({ message: 'If the account exists, a reset link has been sent.' });
  }

  const token = generateResetToken();

  await prisma.user.update({
    where: { email },
    data: {
      // reuse otpCode/otpExpiry as reset token storage
      otpCode: token,
      otpExpiry: resetExpiryDate(),
      otpAttempts: 0,
    },
  });

  const clientBase = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientBase}/auth/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetLink);
  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
    // Still return success to avoid leaking.
  }

  return res.json({ message: 'If the account exists, a reset link has been sent.' });
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, token, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'Account not found' });

  if (!user.otpCode || !user.otpExpiry) {
    return res.status(400).json({ error: 'No reset request pending. Please request a new one.' });
  }
  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ error: 'Reset link expired. Please request a new one.' });
  }
  const MAX_RESET_ATTEMPTS = 5;
  if (user.otpAttempts >= MAX_RESET_ATTEMPTS) {
    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiry: null },
    });
    return res.status(429).json({ error: 'Too many attempts. Please request a new reset link.' });
  }
  if (user.otpCode !== token) {
    await prisma.user.update({
      where: { email },
      data: { otpAttempts: { increment: 1 } },
    });
    return res.status(400).json({ error: 'Invalid reset token' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      otpCode: null,
      otpExpiry: null,
      otpAttempts: 0,
    },
  });

  // Send password reset success notification email
  try {
    await sendPasswordResetSuccessEmail(user.email, user.name);
  } catch (err) {
    console.error('Failed to send password reset success email:', err.message);
    // Don't fail the reset just because the notification email didn't send
  }

  return res.json({ message: 'Password reset successful' });
}

module.exports = { register, verifyOtp, resendOtp, login, me, forgotPassword, resetPassword };
