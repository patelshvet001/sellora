const prisma = require('../lib/prisma');
const { z } = require('zod');

// GET /api/provider/stats
async function getProviderStats(req, res) {
  const providerProfile = await prisma.serviceProviderProfile.findUnique({ where: { userId: req.user.id } });
  if (!providerProfile) return res.status(403).json({ error: 'Only service providers can view this' });

  const [serviceCount, activeServiceCount, bookings] = await Promise.all([
    prisma.service.count({ where: { providerId: providerProfile.id } }),
    prisma.service.count({ where: { providerId: providerProfile.id, isActive: true } }),
    prisma.booking.findMany({ where: { service: { providerId: providerProfile.id } } }),
  ]);

  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const pending = bookings.filter((b) => ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));
  const totalEarnings = completed.reduce((sum, b) => sum + Number(b.price), 0);

  return res.json({
    stats: {
      isApproved: providerProfile.isApproved,
      businessName: providerProfile.businessName,
      serviceCount,
      activeServiceCount,
      totalBookings: bookings.length,
      pendingBookings: pending.length,
      completedBookings: completed.length,
      totalEarnings,
    },
  });
}

// GET /api/provider/services — this provider's full catalog, including inactive
async function myServices(req, res) {
  const providerProfile = await prisma.serviceProviderProfile.findUnique({ where: { userId: req.user.id } });
  if (!providerProfile) return res.status(403).json({ error: 'Only service providers can view this' });

  const services = await prisma.service.findMany({
    where: { providerId: providerProfile.id },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ services });
}

const serviceUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  durationMins: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/provider/services/:id
async function updateService(req, res) {
  const providerProfile = await prisma.serviceProviderProfile.findUnique({ where: { userId: req.user.id } });
  if (!providerProfile) return res.status(403).json({ error: 'Only service providers can edit services' });

  const service = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
  if (!service || service.providerId !== providerProfile.id) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const parsed = serviceUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const updated = await prisma.service.update({ where: { id: service.id }, data: parsed.data });
  return res.json({ service: updated });
}

// DELETE /api/provider/services/:id
async function deleteService(req, res) {
  const providerProfile = await prisma.serviceProviderProfile.findUnique({ where: { userId: req.user.id } });
  if (!providerProfile) return res.status(403).json({ error: 'Only service providers can delete services' });

  const service = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
  if (!service || service.providerId !== providerProfile.id) {
    return res.status(404).json({ error: 'Service not found' });
  }

  await prisma.service.delete({ where: { id: service.id } });
  return res.json({ message: 'Service deleted' });
}

module.exports = { getProviderStats, myServices, updateService, deleteService };
