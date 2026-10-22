const prisma = require('../lib/prisma');
const { z } = require('zod');
const { sendOrderPlacedEmail, sendOrderStatusEmail, sendVendorOrderNotification } = require('../lib/mailer');

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${stamp}-${rand}`;
}

const createOrderSchema = z.object({
  addressId: z.number().int(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD', 'WALLET']).default('COD'),
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'Cart is empty'),
});

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE = 40;

// POST /api/orders — customer checkout. Prices are always re-read from the
// database rather than trusted from the client, so a tampered cart can't
// under-charge or reference a product that no longer exists.
async function createOrder(req, res) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;

  const address = await prisma.address.findUnique({ where: { id: data.addressId } });
  if (!address || address.userId !== req.user.id) {
    return res.status(404).json({ error: 'Address not found' });
  }

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
  if (products.length !== productIds.length) {
    return res.status(400).json({ error: 'One or more items in your cart are no longer available' });
  }

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Not enough stock for "${product.name}"` });
    }
  }

  const lineItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPrice = product.discountPrice ?? product.price;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal: Number(unitPrice) * item.quantity,
    };
  });

  const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const discount = 0; // Coupon validation is a future enhancement — accepted but not applied yet.
  const total = subtotal + deliveryFee - discount;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: req.user.id,
        addressId: data.addressId,
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode: data.couponCode || null,
        notes: data.notes || null,
        items: { create: lineItems },
      },
include: { items: { include: { product: { include: { vendor: true } } } }, address: true, payment: true },
    });

    await tx.payment.create({
      data: {
        orderId: created.id,
        amount: total,
        method: data.paymentMethod,
        status: data.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
      },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.notification.create({
      data: {
        userId: req.user.id,
        channel: 'IN_APP',
        title: 'Order placed',
        message: `Your order ${created.orderNumber} has been placed successfully.`,
      },
    });

    return created;
  });

  // Send email confirmation to customer (non-blocking)
  try {
    await sendOrderPlacedEmail(req.user.email, req.user.name, order);
  } catch (emailErr) {
    console.error('Failed to send order placed email:', emailErr.message);
  }

  // Notify each vendor whose products are in this order (non-blocking)
  try {
    const vendorIds = [...new Set(order.items.map(it => it.product.vendorId))];
    for (const vendorId of vendorIds) {
      const vendorItems = order.items.filter(it => it.product.vendorId === vendorId);
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { user: { select: { name: true, email: true } } },
      });
      if (vendorProfile?.user?.email) {
        await sendVendorOrderNotification(
          vendorProfile.user.email,
          vendorProfile.user.name,
          { ...order, customer: { name: req.user.name } },
          vendorItems
        );
      }
    }
  } catch (vendorEmailErr) {
    console.error('Failed to send vendor notification email:', vendorEmailErr.message);
  }

  return res.status(201).json({ message: 'Order placed', order });
}

// GET /api/orders/mine — customer's own orders
async function listMyOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { customerId: req.user.id },
    include: { items: { include: { product: true } }, address: true, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ orders });
}

// GET /api/orders/:id — visible to the owning customer, any vendor with an item
// in the order, the assigned delivery partner, or an admin.
async function getOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      items: { include: { product: { include: { vendor: true } } } },
      address: true,
      payment: true,
      deliveryPartner: { include: { user: { select: { name: true, phone: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const isOwner = order.customerId === req.user.id;
  const isAdmin = req.user.role === 'ADMIN';
  const isAssignedDelivery =
    req.user.role === 'DELIVERY_PARTNER' &&
    order.deliveryPartner?.userId === req.user.id;
  const isVendorOnOrder =
    req.user.role === 'VENDOR' && order.items.some((it) => it.product.vendor.userId === req.user.id);

  if (!isOwner && !isAdmin && !isAssignedDelivery && !isVendorOnOrder) {
    return res.status(403).json({ error: 'You do not have access to this order' });
  }

  return res.json({ order });
}

// GET /api/vendor/orders — orders containing at least one of this vendor's products
async function listVendorOrders(req, res) {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!vendorProfile) return res.status(403).json({ error: 'Only vendors can view this' });

  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { vendorId: vendorProfile.id } } } },
    include: {
      items: { include: { product: true } },
      address: true,
      customer: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Only surface this vendor's own line items so one vendor never sees another's pricing.
  const scoped = orders.map((o) => ({
    ...o,
    items: o.items.filter((it) => it.product.vendorId === vendorProfile.id),
  }));

  return res.json({ orders: scoped });
}

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED']),
});

// PATCH /api/orders/:id/status — vendor (own orders), delivery partner (assigned), or admin
async function updateOrderStatus(req, res) {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: { include: { product: true } }, deliveryPartner: true },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const isAdmin = req.user.role === 'ADMIN';
  const isAssignedDelivery = req.user.role === 'DELIVERY_PARTNER' && order.deliveryPartner?.userId === req.user.id;

  let isVendorOnOrder = false;
  if (req.user.role === 'VENDOR') {
    const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
    isVendorOnOrder = !!vendorProfile && order.items.some((it) => it.product.vendorId === vendorProfile.id);
  }

  if (!isAdmin && !isAssignedDelivery && !isVendorOnOrder) {
    return res.status(403).json({ error: 'You cannot update this order' });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: parsed.data.status },
    include: { items: { include: { product: true } }, address: true, payment: true, customer: { select: { name: true, email: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: order.customerId,
      channel: 'IN_APP',
      title: 'Order update',
      message: `Order ${order.orderNumber} is now ${parsed.data.status.replace(/_/g, ' ').toLowerCase()}.`,
    },
  });

  // Send email update to customer (non-blocking)
  try {
    if (updated.customer?.email) {
      await sendOrderStatusEmail(updated.customer.email, updated.customer.name, updated);
    }
  } catch (emailErr) {
    console.error('Failed to send order status email:', emailErr.message);
  }

  return res.json({ message: 'Order status updated', order: updated });
}

// GET /api/delivery/orders/available — packed orders with no delivery partner yet
async function listAvailableDeliveries(req, res) {
  const orders = await prisma.order.findMany({
    where: { deliveryPartnerId: null, status: { in: ['PACKED', 'CONFIRMED'] } },
    include: { address: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return res.json({ orders });
}

// GET /api/delivery/orders/mine — orders assigned to this delivery partner
async function listMyDeliveries(req, res) {
  const profile = await prisma.deliveryPartnerProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(403).json({ error: 'Only delivery partners can view this' });

  const orders = await prisma.order.findMany({
    where: { deliveryPartnerId: profile.id },
    include: { address: true, items: { include: { product: true } }, customer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ orders });
}

// POST /api/delivery/orders/:id/accept
async function acceptDelivery(req, res) {
  const profile = await prisma.deliveryPartnerProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(403).json({ error: 'Only delivery partners can accept orders' });
  if (!profile.isApproved) return res.status(403).json({ error: 'Your delivery account is pending approval' });

  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.deliveryPartnerId) return res.status(409).json({ error: 'Order already assigned to another partner' });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { deliveryPartnerId: profile.id, status: 'OUT_FOR_DELIVERY' },
  });

  return res.json({ message: 'Delivery accepted', order: updated });
}

// GET /api/delivery/stats — dashboard summary cards for a delivery partner
async function getDeliveryStats(req, res) {
  const profile = await prisma.deliveryPartnerProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(403).json({ error: 'Only delivery partners can view this' });

  const deliveries = await prisma.order.findMany({ where: { deliveryPartnerId: profile.id } });
  const completed = deliveries.filter((o) => o.status === 'DELIVERED');
  const pending = deliveries.filter((o) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status));
  const totalEarnings = completed.reduce((sum, o) => sum + Number(o.deliveryFee), 0);

  const availableCount = await prisma.order.count({
    where: { deliveryPartnerId: null, status: { in: ['PACKED', 'CONFIRMED'] } },
  });

  return res.json({
    stats: {
      isApproved: profile.isApproved,
      vehicleType: profile.vehicleType,
      isOnline: profile.isOnline,
      totalDeliveries: deliveries.length,
      pendingDeliveries: pending.length,
      completedDeliveries: completed.length,
      availableCount,
      totalEarnings,
    },
  });
}

module.exports = {
  createOrder,
  listMyOrders,
  getOrder,
  listVendorOrders,
  updateOrderStatus,
  listAvailableDeliveries,
  listMyDeliveries,
  acceptDelivery,
  getDeliveryStats,
  STATUS_FLOW,
};
