const prisma = require('../lib/prisma');
const { z } = require('zod');
const { sendBookingRequestedEmail, sendBookingStatusEmail, sendProviderBookingNotification } = require('../lib/mailer');

function generateBookingNo() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BKG-${stamp}-${rand}`;
}

const createBookingSchema = z.object({
  serviceId: z.number().int(),
  scheduledAt: z.string().min(1, 'Please choose a date and time'),
  address: z.string().min(3),
  city: z.string().min(2),
  pincode: z.string().min(4),
  notes: z.string().optional(),
});

// POST /api/bookings — customer books a service
async function createBooking(req, res) {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;

  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service || !service.isActive) return res.status(404).json({ error: 'Service not found' });

  const scheduledDate = new Date(data.scheduledAt);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
    return res.status(400).json({ error: 'Please choose a valid future date and time' });
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        bookingNo: generateBookingNo(),
        customerId: req.user.id,
        serviceId: service.id,
        scheduledAt: scheduledDate,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        price: service.price,
        notes: data.notes || null,
      },
      include: { service: { include: { provider: { include: { user: { select: { name: true, email: true } } } } } } },
    });

    await tx.payment.create({
      data: { bookingId: created.id, amount: service.price, method: 'COD', status: 'PENDING' },
    });

    await tx.notification.create({
      data: {
        userId: req.user.id,
        channel: 'IN_APP',
        title: 'Booking requested',
        message: `Your booking ${created.bookingNo} for "${service.title}" has been requested.`,
      },
    });

    return created;
  });

  // Send email confirmation to customer (non-blocking)
  try {
    await sendBookingRequestedEmail(req.user.email, req.user.name, booking);
  } catch (emailErr) {
    console.error('Failed to send booking requested email:', emailErr.message);
  }

  // Notify provider (non-blocking)
  try {
    const providerUser = booking.service?.provider?.user;
    if (providerUser?.email) {
      await sendProviderBookingNotification(
        providerUser.email,
        providerUser.name,
        { ...booking, customer: { name: req.user.name, phone: req.user.phone } }
      );
    }
  } catch (providerEmailErr) {
    console.error('Failed to send provider notification email:', providerEmailErr.message);
  }

  return res.status(201).json({ message: 'Booking requested', booking });
}

// GET /api/bookings/mine — customer's own bookings
async function listMyBookings(req, res) {
  const bookings = await prisma.booking.findMany({
    where: { customerId: req.user.id },
    include: { service: true, payment: true },
    orderBy: { scheduledAt: 'desc' },
  });
  return res.json({ bookings });
}

// GET /api/provider/bookings — bookings for this provider's services
async function listProviderBookings(req, res) {
  const providerProfile = await prisma.serviceProviderProfile.findUnique({ where: { userId: req.user.id } });
  if (!providerProfile) return res.status(403).json({ error: 'Only service providers can view this' });

  const bookings = await prisma.booking.findMany({
    where: { service: { providerId: providerProfile.id } },
    include: { service: true, customer: { select: { name: true, phone: true } } },
    orderBy: { scheduledAt: 'asc' },
  });
  return res.json({ bookings });
}

const statusUpdateSchema = z.object({
  status: z.enum(['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED']),
});

// PATCH /api/bookings/:id/status — service provider (own booking) or admin
async function updateBookingStatus(req, res) {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const booking = await prisma.booking.findUnique({
    where: { id: Number(req.params.id) },
    include: { service: { include: { provider: { include: { user: { select: { name: true, email: true } } } } } } },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.user.role !== 'ADMIN') {
    const providerProfile = await prisma.serviceProviderProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile || booking.service.providerId !== providerProfile.id) {
      return res.status(403).json({ error: 'You cannot update this booking' });
    }
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: parsed.data.status },
    include: { service: true, customer: { select: { name: true, email: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: booking.customerId,
      channel: 'IN_APP',
      title: 'Booking update',
      message: `Booking ${booking.bookingNo} is now ${parsed.data.status.replace(/_/g, ' ').toLowerCase()}.`,
    },
  });

  // Send email update to customer (non-blocking)
  try {
    const customer = await prisma.user.findUnique({ where: { id: booking.customerId }, select: { name: true, email: true } });
    if (customer?.email) {
      await sendBookingStatusEmail(customer.email, customer.name, { ...updated, service: booking.service });
    }
  } catch (emailErr) {
    console.error('Failed to send booking status email:', emailErr.message);
  }

  return res.json({ message: 'Booking status updated', booking: updated });
}

module.exports = { createBooking, listMyBookings, listProviderBookings, updateBookingStatus };
