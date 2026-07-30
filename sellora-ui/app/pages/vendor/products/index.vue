<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import Card from '~/components/ui/Card.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Button from '~/components/ui/Button.vue';
import Modal from '~/components/ui/Modal.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useVendorStore } from '~/stores/vendor';
import { useVendorNav } from '~/composables/useVendorNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['VENDOR'] });
useHead({ title: 'My Products — Sellora Vendor' });

const vendorStore = useVendorStore();
const { navItems } = useVendorNav();

// ---------- Category state ----------
const showCategoryForm = ref(false);
const categoryForm = ref({ name: '', slug: '', iconUrl: '' });
const savingCategory = ref(false);

// ---------- Product state ----------
const selectedCategoryId = ref<number | null>(null);
const showProductForm = ref(false);
const editingProduct = ref<any | null>(null);
const savingProduct = ref(false);
const productForm = ref({
  categoryId: null as number | null,
  name: '',
  slug: '',
  price: '',
  discountPrice: '',
  stock: '0',
  imageUrl: '',
  description: '',
});

// ---------- Category helpers ----------
function slugify(val: string) {
  return val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function resetCategoryForm() {
  categoryForm.value = { name: '', slug: '', iconUrl: '' };
}

function openAddCategory() {
  resetCategoryForm();
  showCategoryForm.value = true;
}

async function saveCategory() {
  savingCategory.value = true;
  const ok = await vendorStore.createCategory({
    name: categoryForm.value.name,
    slug: categoryForm.value.slug || slugify(categoryForm.value.name),
    iconUrl: categoryForm.value.iconUrl || undefined,
  });
  savingCategory.value = false;
  if (ok) {
    showCategoryForm.value = false;
    resetCategoryForm();
  }
}

async function removeCategory(cat: any) {
  if (confirm(`Delete category "${cat.name}"? This cannot be undone. Products linked to this category must be removed first.`)) {
    await vendorStore.deleteCategory(cat.id);
  }
}

// ---------- Product helpers ----------
function resetProductForm() {
  productForm.value = {
    categoryId: selectedCategoryId.value,
    name: '',
    slug: '',
    price: '',
    discountPrice: '',
    stock: '0',
    imageUrl: '',
    description: '',
  };
  editingProduct.value = null;
}

function openNewProduct() {
  resetProductForm();
  if (!selectedCategoryId.value && vendorStore.categories.length > 0) {
    productForm.value.categoryId = vendorStore.categories[0].id;
  }
  showProductForm.value = true;
}

function openEditProduct(p: any) {
  editingProduct.value = p;
  productForm.value = {
    categoryId: p.categoryId,
    name: p.name,
    slug: p.slug,
    price: String(p.price),
    discountPrice: p.discountPrice ? String(p.discountPrice) : '',
    stock: String(p.stock),
    imageUrl: p.imageUrl || '',
    description: p.description || '',
  };
  showProductForm.value = true;
}

async function saveProduct() {
  savingProduct.value = true;
  const payload: Record<string, any> = {
    categoryId: Number(productForm.value.categoryId),
    name: productForm.value.name,
    slug: productForm.value.slug || slugify(productForm.value.name),
    price: Number(productForm.value.price),
    stock: Number(productForm.value.stock),
    description: productForm.value.description || undefined,
    imageUrl: productForm.value.imageUrl || undefined,
  };
  if (productForm.value.discountPrice) {
    payload.discountPrice = Number(productForm.value.discountPrice);
  }

  let ok: boolean;
  if (editingProduct.value) {
    ok = await vendorStore.updateProduct(editingProduct.value.id, payload);
  } else {
    ok = await vendorStore.createProduct(payload);
  }
  savingProduct.value = false;
  if (ok) {
    showProductForm.value = false;
    resetProductForm();
    await vendorStore.fetchProducts();
  }
}

async function toggleActive(p: any) {
  await vendorStore.updateProduct(p.id, { isActive: !p.isActive });
  await vendorStore.fetchProducts();
}

async function removeProduct(p: any) {
  if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
    await vendorStore.deleteProduct(p.id);
  }
}

// Filter products by selected category
const filteredProducts = computed(() => {
  if (!selectedCategoryId.value) return vendorStore.products;
  return vendorStore.products.filter((p) => p.categoryId === selectedCategoryId.value);
});

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return 'All Categories';
  const cat = vendorStore.categories.find((c) => c.id === selectedCategoryId.value);
  return cat ? cat.name : 'Unknown';
});

onMounted(async () => {
  await Promise.all([
    vendorStore.fetchCategories(),
    vendorStore.fetchProducts(),
  ]);
});
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Vendor" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-6xl">
      <!-- ====== Categories Section ====== -->
      <div class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900">📂 Categories</h2>
          <Button size="sm" variant="secondary" @click="openAddCategory">+ Add Category</Button>
        </div>

        <div v-if="vendorStore.loadingCategories" class="text-sm text-gray-400 py-3">Loading categories...</div>

        <div v-else-if="!vendorStore.categories.length" class="rounded-2xl bg-white border border-dashed border-gray-200 px-5 py-6 text-center">
          <p class="text-sm text-gray-500 mb-3">No categories yet. Create your first category to organize your products.</p>
          <Button size="sm" @click="openAddCategory">+ Create First Category</Button>
        </div>

        <div v-else class="flex flex-wrap gap-2">
          <button
            class="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            :class="!selectedCategoryId ? 'bg-teal-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
            @click="selectedCategoryId = null"
          >
            All
          </button>
          <div
            v-for="cat in vendorStore.categories"
            :key="cat.id"
            class="group relative"
          >
            <button
              class="px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
              :class="selectedCategoryId === cat.id ? 'bg-teal-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
              @click="selectedCategoryId = cat.id"
            >
              <span>{{ cat.iconUrl || '📁' }}</span>
              <span>{{ cat.name }}</span>
            </button>
            <button
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
              title="Delete category"
              @click="removeCategory(cat)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- ====== Products Section ====== -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-900">🛍️ Products</h2>
            <p v-if="selectedCategoryId" class="text-xs text-gray-400 mt-0.5">
              Showing products in: <span class="font-semibold text-gray-600">{{ selectedCategoryName }}</span>
            </p>
          </div>
          <Button
            size="sm"
            :disabled="!vendorStore.categories.length"
            :title="!vendorStore.categories.length ? 'Create a category first' : 'Add a new product'"
            @click="openNewProduct"
          >
            + Add Product
          </Button>
        </div>

        <!-- Warning if no categories -->
        <div v-if="!vendorStore.categories.length && !vendorStore.loadingCategories" class="mb-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs px-4 py-3">
          ⚠️ You need to <button class="font-bold underline" @click="openAddCategory">create a category</button> first before adding products.
        </div>

        <div v-if="vendorStore.loading" class="text-gray-400 text-center py-16">Loading products...</div>

        <EmptyState
          v-else-if="!vendorStore.products.length"
          icon="🛍️"
          title="No Products Yet"
          description="You haven't added any products for customers to purchase."
          :action-text="vendorStore.categories.length ? '+ Add First Product' : undefined"
          @action="openNewProduct"
        />

        <EmptyState
          v-else-if="!filteredProducts.length"
          icon="🔍"
          title="No Products in this Category"
          :description="'There are no products in \u201C' + selectedCategoryName + '\u201D. Switch to a different category or add a new product.'"
        />

        <div v-else class="space-y-3">
          <Card v-for="p in filteredProducts" :key="p.id" class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="p.imageUrl" :src="p.imageUrl" class="w-full h-full object-cover" />
              <span v-else class="text-xl">🛍️</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">{{ p.name }}</p>
              <p class="text-xs text-gray-400">
                {{ p.category?.name || 'Uncategorized' }}
                <span v-if="p.stock <= 5" class="ml-2 text-rose-500 font-semibold">Low stock ({{ p.stock }})</span>
                <span v-else class="ml-2 text-gray-400">Stock: {{ p.stock }}</span>
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-bold text-gray-900">₹{{ p.discountPrice ?? p.price }}</p>
              <p v-if="p.discountPrice" class="text-xs text-gray-400 line-through">₹{{ p.price }}</p>
            </div>
            <StatusBadge :status="p.isActive ? 'ACTIVE' : 'DEACTIVATED'" />
            <div class="flex gap-3 ml-2 shrink-0">
              <button class="text-xs font-semibold text-teal-600 hover:underline" @click="openEditProduct(p)">Edit</button>
              <button class="text-xs font-semibold text-gray-500 hover:underline" @click="toggleActive(p)">
                {{ p.isActive ? 'Hide' : 'Show' }}
              </button>
              <button class="text-xs font-semibold text-rose-600 hover:underline" @click="removeProduct(p)">Delete</button>
            </div>
          </Card>
        </div>
      </div>

      <!-- ====== Add Category Modal ====== -->
      <Modal v-model="showCategoryForm" title="Add New Category" max-width="sm">
        <form class="space-y-4" @submit.prevent="saveCategory">
          <div>
            <label class="text-xs font-semibold text-gray-600">Category Name</label>
            <input
              v-model="categoryForm.name"
              required
              class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
              placeholder="e.g. Electronics"
              @input="categoryForm.slug = slugify(categoryForm.name)"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Slug</label>
            <input
              v-model="categoryForm.slug"
              required
              class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
              placeholder="electronics"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Icon URL <span class="text-gray-400">(optional)</span></label>
            <input
              v-model="categoryForm.iconUrl"
              class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
              placeholder="https://..."
            />
          </div>
          <p v-if="vendorStore.error" class="text-sm text-rose-600">{{ vendorStore.error }}</p>
          <div class="flex gap-3 pt-2">
            <Button type="button" variant="secondary" class="flex-1" @click="showCategoryForm = false">Cancel</Button>
            <Button type="submit" class="flex-1" :loading="savingCategory">Add Category</Button>
          </div>
        </form>
      </Modal>

      <!-- ====== Add/Edit Product Modal ====== -->
      <Modal v-model="showProductForm" :title="editingProduct ? 'Edit Product' : 'Add New Product'" max-width="lg">
        <form class="space-y-4" @submit.prevent="saveProduct">
          <!-- Category Selection -->
          <div>
            <label class="text-xs font-semibold text-gray-600">Category <span class="text-rose-500">*</span></label>
            <select
              v-model="productForm.categoryId"
              required
              class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
            >
              <option v-for="cat in vendorStore.categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <p v-if="!vendorStore.categories.length" class="text-xs text-amber-600 mt-1">
              No categories available. Please create one first.
            </p>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600">Product Name</label>
            <input
              v-model="productForm.name"
              required
              class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
              @input="!editingProduct ? (productForm.slug = slugify(productForm.name)) : null"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Slug</label>
            <input
              v-model="productForm.slug"
              required
              class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
            />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-xs font-semibold text-gray-600">Price (₹)</label>
              <input v-model="productForm.price" type="number" min="0" step="0.01" required class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600">Discount Price</label>
              <input v-model="productForm.discountPrice" type="number" min="0" step="0.01" placeholder="Optional" class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600">Stock</label>
              <input v-model="productForm.stock" type="number" min="0" required class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Image URL</label>
            <input v-model="productForm.imageUrl" placeholder="https://..." class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Description</label>
            <textarea v-model="productForm.description" rows="3" class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm"></textarea>
          </div>
          <p v-if="vendorStore.error" class="text-sm text-rose-600">{{ vendorStore.error }}</p>
          <div class="flex gap-3 pt-2">
            <Button type="button" variant="secondary" class="flex-1" @click="showProductForm = false">Cancel</Button>
            <Button type="submit" class="flex-1" :loading="savingProduct">
              {{ editingProduct ? 'Save changes' : 'Add Product' }}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  </div>
</template>

