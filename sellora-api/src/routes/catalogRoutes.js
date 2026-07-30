const express = require('express');
const router = express.Router();
const {
  listCategories,
  createCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  myProducts,
  listServices,
  getService,
  createService,
} = require('../controllers/catalogController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Categories
router.get('/categories', listCategories);
router.post('/categories', requireAuth, requireRole('ADMIN', 'VENDOR'), createCategory);
router.delete('/categories/:id', requireAuth, requireRole('ADMIN', 'VENDOR'), require('../controllers/catalogController').deleteCategory);

// Products (public browse)
router.get('/products', listProducts);
router.get('/products/:slug', getProduct);

// Products (vendor-managed)
router.get('/vendor/products', requireAuth, requireRole('VENDOR'), myProducts);
router.post('/products', requireAuth, requireRole('VENDOR'), createProduct);
router.patch('/products/:id', requireAuth, requireRole('VENDOR'), updateProduct);
router.delete('/products/:id', requireAuth, requireRole('VENDOR'), deleteProduct);

// Services (public browse + provider-managed)
router.get('/services', listServices);
router.get('/services/:idOrSlug', getService);
router.post('/services', requireAuth, requireRole('SERVICE_PROVIDER'), createService);

module.exports = router;
