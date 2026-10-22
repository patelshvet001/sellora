const prisma = require('../lib/prisma');
const { sendApprovalStatusEmail } = require('../lib/mailer');

// GET /api/admin/stats — platform-wide overview cards
async function getAdminStats(req, res) {
  const [userCount, vendorCount, providerCount, deliveryCount, orderCount, bookingCount, pendingVendors, pendingProviders, pendingDelivery] =
    await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.vendorProfile.count(),
      prisma.serviceProviderProfile.count(),
      prisma.deliveryPartnerProfile.count(),
      prisma.order.count(),
      prisma.booking.count(),
      prisma.vendorProfile.count({ where: { isApproved: false } }),
      prisma.serviceProviderProfile.count({ where: { isApproved: false } }),
      prisma.deliveryPartnerProfile.count({ where: { isApproved: false } }),
    ]);

  const orders = await prisma.order.findMany({ where: { status: 'DELIVERED' }, select: { total: true } });
  const gmv = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return res.json({
    stats: {
      userCount,
      vendorCount,
      providerCount,
      deliveryCount,
      orderCount,
      bookingCount,
      pendingApprovals: pendingVendors + pendingProviders + pendingDelivery,
      pendingVendors,
      pendingProviders,
      pendingDelivery,
      gmv,
    },
  });
}

// GET /api/admin/users?role=CUSTOMER
async function listUsers(req, res) {
  const { role } = req.query;
  const where = role ? { role: String(role) } : {};
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, isVerified: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ users });
}

// PATCH /api/admin/users/:id/status — activate/deactivate an account
async function setUserActive(req, res) {
  const isActive = !!req.body.isActive;
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });
  return res.json({ message: `Account ${isActive ? 'activated' : 'deactivated'}`, user });
}

// GET /api/admin/users/:id
async function getUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      addresses: true,
      vendorProfile: true,
      providerProfile: true,
      deliveryProfile: true,
      orders: { take: 10, orderBy: { createdAt: 'desc' } },
      bookings: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
}

// PATCH /api/admin/users/:id
async function updateUser(req, res) {
  const userId = Number(req.params.id);
  const { name, phone, role, isActive, isVerified } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = !!isActive;
  if (isVerified !== undefined) updateData.isVerified = !!isVerified;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      vendorProfile: true,
      providerProfile: true,
      deliveryProfile: true,
    },
  });
  return res.json({ message: 'User updated successfully', user });
}

// GET /api/admin/vendors
async function listVendors(req, res) {
  const vendors = await prisma.vendorProfile.findMany({
    include: { user: { select: { name: true, email: true, phone: true, isActive: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ vendors });
}

// PATCH /api/admin/vendors/:id/approve
async function approveVendor(req, res) {
  const isApproved = req.body.isApproved !== false;
  const vendor = await prisma.vendorProfile.update({
    where: { id: Number(req.params.id) },
    data: { isApproved },
  });

  // Send email notification to vendor
  try {
    const vendorWithUser = await prisma.vendorProfile.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { select: { name: true, email: true } } },
    });
    if (vendorWithUser?.user?.email) {
      await sendApprovalStatusEmail(vendorWithUser.user.email, vendorWithUser.user.name, 'VENDOR', isApproved);
    }
  } catch (emailErr) {
    console.error('Failed to send vendor approval email:', emailErr.message);
  }

  return res.json({ message: isApproved ? 'Vendor approved' : 'Vendor approval revoked', vendor });
}

// GET /api/admin/providers
async function listProviders(req, res) {
  const providers = await prisma.serviceProviderProfile.findMany({
    include: { user: { select: { name: true, email: true, phone: true, isActive: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ providers });
}

// PATCH /api/admin/providers/:id/approve
async function approveProvider(req, res) {
  const isApproved = req.body.isApproved !== false;
  const provider = await prisma.serviceProviderProfile.update({
    where: { id: Number(req.params.id) },
    data: { isApproved },
  });

  // Send email notification to provider
  try {
    const providerWithUser = await prisma.serviceProviderProfile.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { select: { name: true, email: true } } },
    });
    if (providerWithUser?.user?.email) {
      await sendApprovalStatusEmail(providerWithUser.user.email, providerWithUser.user.name, 'SERVICE_PROVIDER', isApproved);
    }
  } catch (emailErr) {
    console.error('Failed to send provider approval email:', emailErr.message);
  }

  return res.json({ message: isApproved ? 'Provider approved' : 'Provider approval revoked', provider });
}

// GET /api/admin/delivery-partners
async function listDeliveryPartners(req, res) {
  const partners = await prisma.deliveryPartnerProfile.findMany({
    include: { user: { select: { name: true, email: true, phone: true, isActive: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ partners });
}

// PATCH /api/admin/delivery-partners/:id/approve
async function approveDeliveryPartner(req, res) {
  const isApproved = req.body.isApproved !== false;
  const partner = await prisma.deliveryPartnerProfile.update({
    where: { id: Number(req.params.id) },
    data: { isApproved },
  });

  // Send email notification to delivery partner
  try {
    const partnerWithUser = await prisma.deliveryPartnerProfile.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { select: { name: true, email: true } } },
    });
    if (partnerWithUser?.user?.email) {
      await sendApprovalStatusEmail(partnerWithUser.user.email, partnerWithUser.user.name, 'DELIVERY_PARTNER', isApproved);
    }
  } catch (emailErr) {
    console.error('Failed to send delivery partner approval email:', emailErr.message);
  }

  return res.json({ message: isApproved ? 'Delivery partner approved' : 'Approval revoked', partner });
}

// GET /api/admin/orders — every order on the platform
async function listAllOrders(req, res) {
  const orders = await prisma.order.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      items: { include: { product: true } },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return res.json({ orders });
}

module.exports = {
  getAdminStats,
  listUsers,
  getUser,
  updateUser,
  setUserActive,
  listVendors,
  approveVendor,
  listProviders,
  approveProvider,
  listDeliveryPartners,
  approveDeliveryPartner,
  listAllOrders,
};
