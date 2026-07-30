<script setup lang="ts">
/** /shop — browse products across all vendors, add to cart */
import { ref, computed, onMounted } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';
import { useCartStore } from '~/stores/cart';

useHead({ title: 'Shop Products — Sellora' });

const cartStore = useCartStore();
const products = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(true);
const search = ref('');
const activeCategory = ref('');
const justAdded = ref<number | null>(null);

async function load() {
  loading.value = true;
  const { request } = useApi();
  try {
    const [prodRes, catRes] = await Promise.all([
      request<{ products: any[] }>(`/products${activeCategory.value ? `?category=${activeCategory.value}` : ''}`),
      request<{ categories: any[] }>('/categories'),
    ]);
    products.value = prodRes.products;
    categories.value = catRes.categories;
  } catch (e) {
    // Leave empty state to render below
  } finally {
    loading.value = false;
  }
}

function addToCart(p: any) {
  if (p.stock <= 0) return;
  cartStore.addItem({ id: p.id, name: p.name, price: Number(p.discountPrice ?? p.price), image: p.imageUrl || '' });
  justAdded.value = p.id;
  setTimeout(() => (justAdded.value = null), 1200);
}

const filtered = computed(() =>
  products.value.filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase()))
);

onMounted(() => {
  const q = useRoute().query.search;
  if (typeof q === 'string') search.value = q;
  load();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-black text-gray-900">Shop products</h1>
        <p class="text-gray-500 mt-1">Fresh groceries, electronics, apparel & more from local vendors.</p>
      </div>
      <input
        v-model="search"
        type="text"
        placeholder="Search products..."
        class="w-full md:w-72 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 mb-8">
      <button
        class="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
        :class="!activeCategory ? 'bg-teal-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
        @click="activeCategory = ''; load()"
      >
        All
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
        :class="activeCategory === cat.slug ? 'bg-teal-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
        @click="activeCategory = cat.slug; load()"
      >
        {{ cat.name }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400">Loading products...</div>

    <div v-else-if="!filtered.length" class="text-center py-20">
      <p class="text-gray-500">No products found yet. Check back soon, or try a different search.</p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      <Card v-for="p in filtered" :key="p.id" hover class="flex flex-col">
        <div class="aspect-square rounded-xl bg-gray-100 mb-3 overflow-hidden flex items-center justify-center">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="w-full h-full object-cover" />
          <span v-else class="text-3xl">🛍️</span>
        </div>
        <p class="text-xs text-gray-400">{{ p.vendor?.storeName }}</p>
        <h3 class="font-semibold text-gray-900 text-sm line-clamp-2 mt-0.5">{{ p.name }}</h3>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-bold text-gray-900">₹{{ p.discountPrice ?? p.price }}</span>
          <span v-if="p.discountPrice" class="text-xs text-gray-400 line-through">₹{{ p.price }}</span>
        </div>
        <div v-if="p.stock <= 0" class="mt-3 w-full text-center text-xs font-semibold text-rose-500 bg-rose-50 rounded-lg py-2">
          Out of stock
        </div>
        <Button v-else size="sm" class="mt-3 w-full" :variant="justAdded === p.id ? 'success' : 'primary'" @click="addToCart(p)">
          {{ justAdded === p.id ? 'Added ✓' : 'Add to cart' }}
        </Button>
      </Card>
    </div>
  </div>
</template>
