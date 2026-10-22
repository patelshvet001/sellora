const prisma = require('../lib/prisma');

// GET /api/vendor/stats — dashboard summary cards for a vendor
async function getVendorStats(req, res) {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!vendorProfile) return res.status(403).json({ error: 'Only vendors can view this' });

  const [productCount, activeProductCount, orderItems] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendorProfile.id } }),
    prisma.product.count({ where: { vendorId: vendorProfile.id, isActive: true } }),
    prisma.orderItem.findMany({
      where: { product: { vendorId: vendorProfile.id } },
      include: { order: true },
    }),
  ]);

  const deliveredItems = orderItems.filter((it) => it.order.status === 'DELIVERED');
  const pendingItems = orderItems.filter((it) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(it.order.status));

  const totalEarnings = deliveredItems.reduce((sum, it) => sum + Number(it.lineTotal), 0);
  const uniqueOrderIds = new Set(orderItems.map((it) => it.orderId));
  const pendingOrderIds = new Set(pendingItems.map((it) => it.orderId));

  const lowStock = await prisma.product.count({
    where: { vendorId: vendorProfile.id, isActive: true, stock: { lte: 5 } },
  });

  return res.json({
    stats: {
      isApproved: vendorProfile.isApproved,
      storeName: vendorProfile.storeName,
      productCount,
      activeProductCount,
      lowStockCount: lowStock,
      totalOrders: uniqueOrderIds.size,
      pendingOrders: pendingOrderIds.size,
      totalEarnings,
    },
  });
}

module.exports = { getVendorStats };
