const prisma = require('../lib/prisma');
const { z } = require('zod');

// ---------- Categories ----------

async function listCategories(req, res) {
  const categories = await prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return res.json({ categories });
}

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  iconUrl: z.string().optional(),
});

async function createCategory(req, res) {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const category = await prisma.productCategory.create({ data: parsed.data });
  return res.status(201).json({ category });
}

async function deleteCategory(req, res) {
  const { id } = req.params;
  // Check if category has products linked to it
  const productCount = await prisma.product.count({ where: { categoryId: Number(id) } });
  if (productCount > 0) {
    return res.status(400).json({ error: `Cannot delete category: ${productCount} product(s) are linked to it. Remove or reassign them first.` });
  }
  await prisma.productCategory.delete({ where: { id: Number(id) } });
  return res.json({ message: 'Category deleted successfully' });
}

// ---------- Products ----------

async function listProducts(req, res) {
  const { category, search, minPrice, maxPrice, vendorId } = req.query;

  const where = { isActive: true, stock: { gt: 0 }, vendor: { isApproved: true } };
  if (category) where.category = { slug: category };
  if (vendorId) where.vendorId = Number(vendorId);
  if (search) where.name = { contains: String(search) };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true, vendor: { select: { storeName: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ products });
}

async function getProduct(req, res) {
  const param = req.params.slug;
  const isNumeric = /^\d+$/.test(param);
  const where = isNumeric ? { id: Number(param) } : { slug: param };
  const product = await prisma.product.findFirst({
    where,
    include: {
      category: true,
      vendor: true,
      reviews: {
        where: { isFlagged: false },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json({ product });
}

const productSchema = z.object({
  categoryId: z.number().int(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  imageUrl: z.string().optional(),
});

// Explicitly whitelists editable fields only — vendorId, id, createdAt etc.
// can never be set this way even if present in the request body.
const productUpdateSchema = productSchema.partial();

// POST /api/products — vendor only
async function createProduct(req, res) {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!vendorProfile) return res.status(403).json({ error: 'Only vendors can create products' });
  if (!vendorProfile.isApproved) {
    return res.status(403).json({ error: 'Your vendor account is pending admin approval. You can add products once approved.' });
  }

  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const product = await prisma.product.create({
    data: { ...parsed.data, vendorId: vendorProfile.id },
  });
  return res.status(201).json({ product });
}

// PATCH /api/products/:id — vendor (own product) only
async function updateProduct(req, res) {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!vendorProfile) return res.status(403).json({ error: 'Only vendors can edit products' });

  const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  if (!product || product.vendorId !== vendorProfile.id) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: parsed.data,
  });
  return res.json({ product: updated });
}

// DELETE /api/products/:id — vendor (own product) only
async function deleteProduct(req, res) {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!vendorProfile) return res.status(403).json({ error: 'Only vendors can delete products' });

  const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  if (!product || product.vendorId !== vendorProfile.id) {
    return res.status(404).json({ error: 'Product not found' });
  }

  await prisma.product.delete({ where: { id: product.id } });
  return res.json({ message: 'Product deleted' });
}

// GET /api/vendor/products — vendor's own catalog (any status)
async function myProducts(req, res) {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!vendorProfile) return res.status(403).json({ error: 'Only vendors can view this' });

  const products = await prisma.product.findMany({
    where: { vendorId: vendorProfile.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ products });
}

// ---------- Services ----------

async function listServices(req, res) {
  const { search, category, providerId } = req.query;
  const where = { isActive: true, provider: { isApproved: true } };
  if (providerId) where.providerId = Number(providerId);
  if (search) where.title = { contains: String(search) };
  if (category) where.provider = { ...where.provider, category: String(category) };

  const services = await prisma.service.findMany({
    where,
    include: { provider: { select: { businessName: true, category: true, city: true, isApproved: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ services });
}

async function getService(req, res) {
  const param = req.params.idOrSlug;
  const isNumeric = /^\d+$/.test(param);
  const where = isNumeric ? { id: Number(param) } : { slug: param };
  const service = await prisma.service.findFirst({
    where,
    include: { provider: true, reviews: true },
  });
  if (!service) return res.status(404).json({ error: 'Service not found' });
  return res.json({ service });
}

const serviceSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  durationMins: z.number().int().positive().default(60),
  imageUrl: z.string().optional(),
});

// POST /api/services — service provider only
async function createService(req, res) {
  const providerProfile = await prisma.serviceProviderProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!providerProfile) {
    return res.status(403).json({ error: 'Only service providers can create services' });
  }
  if (!providerProfile.isApproved) {
    return res.status(403).json({ error: 'Your provider account is pending admin approval. You can add services once approved.' });
  }

  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const service = await prisma.service.create({
    data: { ...parsed.data, providerId: providerProfile.id },
  });
  return res.status(201).json({ service });
}

module.exports = {
  listCategories,
  createCategory,
  deleteCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  myProducts,
  listServices,
  getService,
  createService,
};
