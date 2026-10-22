const prisma = require('../lib/prisma');
const { createAddressSchema, updateAddressSchema } = require('../lib/validators');

// GET /api/addresses — list all addresses for current user
async function listAddresses(req, res) {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return res.json({ addresses });
}

// POST /api/addresses — create a new address
async function createAddress(req, res) {
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { label, line1, line2, city, state, pincode, lat, lng, isDefault } = parsed.data;

  // If setting as default, unset any existing default first
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      label: label || 'HOME',
      line1,
      line2: line2 || null,
      city,
      state,
      pincode,
      lat: lat ?? null,
      lng: lng ?? null,
      isDefault: isDefault || false,
    },
  });

  return res.status(201).json({ message: 'Address created', address });
}

// PATCH /api/addresses/:id — update an address
async function updateAddress(req, res) {
  const { id } = req.params;

  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id: parseInt(id), userId: req.user.id },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Address not found' });
  }

  const parsed = updateAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { label, line1, line2, city, state, pincode, lat, lng, isDefault } = parsed.data;

  // If setting as default, unset any existing default first
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, isDefault: true, id: { not: parseInt(id) } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: parseInt(id) },
    data: {
      ...(label !== undefined && { label }),
      ...(line1 !== undefined && { line1 }),
      ...(line2 !== undefined && { line2 }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
      ...(isDefault !== undefined && { isDefault }),
    },
  });

  return res.json({ message: 'Address updated', address });
}

// DELETE /api/addresses/:id — delete an address
async function deleteAddress(req, res) {
  const { id } = req.params;

  const existing = await prisma.address.findFirst({
    where: { id: parseInt(id), userId: req.user.id },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Address not found' });
  }

  await prisma.address.delete({ where: { id: parseInt(id) } });

  return res.json({ message: 'Address deleted' });
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };

