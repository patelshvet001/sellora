<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import { useCartStore } from '~/stores/cart';
import { useAuthStore } from '~/stores/auth';

const route = useRoute();
const cartStore = useCartStore();
const authStore = useAuthStore();
const product = ref<any | null>(null);
const loading = ref(true);
const error = ref('');
const justAdded = ref(false);
const quantity = ref(1);

// Review submission
const canReview = ref(false);
const myReview = ref<any | null>(null);
const reviewForm = ref({ rating: 5, comment: '' });
const submittingReview = ref(false);
const reviewError = ref('');
const reviewSuccess = ref('');

async function loadProduct() {
  loading.value = true;
  error.value = '';
  quantity.value = 1;
  const { request } = useApi();
  try {
    const res = await request<{ product: any }>(`/products/${route.params.id}`);
    product.value = res.product;
    if (authStore.user?.role === 'CUSTOMER') await checkReviewEligibility();
  } catch (err: any) {
    error.value = err.message || 'Failed to load product details';
  } finally {
    loading.value = false;
  }
}

async function checkReviewEligibility() {
  if (!product.value) return;
  const { request } = useApi();
  try {
    const res = await request<{ eligible: boolean; existingReview: any }>(
      `/reviews/eligibility?productId=${product.value.id}`,
      { auth: true }
    );
    canReview.value = res.eligible;
    myReview.value = res.existingReview;
    if (res.existingReview) {
      reviewForm.value = { rating: res.existingReview.rating, comment: res.existingReview.comment || '' };
    }
  } catch {
    // Silently ignore — review form just won't show, no need to interrupt the page
    canReview.value = false;
  }
}

async function submitReview() {
  if (!product.value) return;
  submittingReview.value = true;
  reviewError.value = '';
  reviewSuccess.value = '';
  const { request } = useApi();
  try {
    const res = await request<{ message: string; review: any }>('/reviews', {
      method: 'POST',
      auth: true,
      body: { productId: product.value.id, rating: reviewForm.value.rating, comment: reviewForm.value.comment || undefined },
    });
    reviewSuccess.value = res.message;
    myReview.value = res.review;
    await loadProduct();
  } catch (err: any) {
    reviewError.value = err.message || 'Could not submit your review';
  } finally {
    submittingReview.value = false;
  }
}

function incrementQty() {
  if (!product.value) return;
  if (quantity.value < product.value.stock) quantity.value += 1;
}

function decrementQty() {
  if (quantity.value > 1) quantity.value -= 1;
}

function addToCart() {
  if (!product.value || product.value.stock <= 0) return;
  cartStore.addItem(
    {
      id: product.value.id,
      name: product.value.name,
      price: Number(product.value.discountPrice ?? product.value.price),
      image: product.value.imageUrl || '',
      stock: product.value.stock,
    },
    quantity.value
  );
  justAdded.value = true;
  setTimeout(() => (justAdded.value = false), 1500);
}

const reviews = computed(() => product.value?.reviews || []);
const avgRating = computed(() => {
  if (!reviews.value.length) return 0;
  return reviews.value.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.value.length;
});

onMounted(loadProduct);

useHead({
  title: computed(() => (product.value ? `${product.value.name} — Sellora` : 'Product Details — Sellora')),
});
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-10">
    <NuxtLink to="/shop" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 mb-6 transition-colors">
      ← Back to shop
    </NuxtLink>

    <div v-if="loading" class="text-center py-24 text-gray-400">
      Loading product details...
    </div>

    <div v-else-if="error" class="text-center py-20">
      <p class="text-rose-600 mb-4">{{ error }}</p>
      <Button to="/shop" as="NuxtLink">Return to catalog</Button>
    </div>

    <div v-else-if="product" class="grid md:grid-cols-2 gap-10">
      <!-- Image gallery / main picture -->
      <div class="aspect-square rounded-3xl bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center relative shadow-sm">
        <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
        <span v-else class="text-8xl">🛍️</span>
        <div v-if="product.discountPrice" class="absolute top-4 left-4 bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow">
          SALE
        </div>
      </div>

      <!-- Detail Info -->
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            <span>{{ product.category?.name }}</span>
            <span>•</span>
            <span class="text-teal-600">{{ product.vendor?.storeName }}</span>
            <template v-if="reviews.length">
              <span>•</span>
              <span class="flex items-center gap-1 normal-case tracking-normal text-amber-500 font-bold">
                ★ {{ avgRating.toFixed(1) }} <span class="text-gray-400 font-normal">({{ reviews.length }})</span>
              </span>
            </template>
          </div>

          <h1 class="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
            {{ product.name }}
          </h1>

          <div class="flex items-baseline gap-3 mb-6">
            <span class="text-3xl font-black text-gray-900">₹{{ product.discountPrice ?? product.price }}</span>
            <span v-if="product.discountPrice" class="text-lg text-gray-400 line-through">₹{{ product.price }}</span>
          </div>

          <div class="border-t border-b border-gray-100 py-4 mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-2">Description</h3>
            <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {{ product.description || 'No detailed description available for this product.' }}
            </p>
          </div>

          <div class="flex items-center gap-4 mb-6">
            <span class="text-sm font-semibold text-gray-700">Availability:</span>
            <span v-if="product.stock > 0" class="text-sm font-semibold text-emerald-600">
              In Stock ({{ product.stock }} items left)
            </span>
            <span v-else class="text-sm font-semibold text-rose-500">Out of Stock</span>
          </div>
        </div>

        <div class="pt-4">
          <div v-if="product.stock > 0" class="flex items-center gap-3 mb-4">
            <span class="text-sm font-semibold text-gray-700">Quantity:</span>
            <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="quantity <= 1"
                @click="decrementQty"
              >
                −
              </button>
              <span class="w-10 text-center text-sm font-bold text-gray-900">{{ quantity }}</span>
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="quantity >= product.stock"
                @click="incrementQty"
              >
                +
              </button>
            </div>
          </div>
          <Button
            size="lg"
            class="w-full text-base py-4"
            :variant="justAdded ? 'success' : 'primary'"
            :disabled="product.stock <= 0"
            @click="addToCart"
          >
            {{ justAdded ? 'Added to Cart ✓' : product.stock <= 0 ? 'Out of Stock' : `Add ${quantity > 1 ? quantity + ' ' : ''}to Cart` }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Reviews -->
    <div v-if="product" class="max-w-3xl mt-14 pt-10 border-t border-gray-100">
      <h2 class="text-xl font-black text-gray-900 mb-1">Customer reviews</h2>
      <p v-if="reviews.length" class="text-sm text-gray-500 mb-6">
        <span class="text-amber-500 font-bold">★ {{ avgRating.toFixed(1) }}</span> average from {{ reviews.length }} review{{ reviews.length === 1 ? '' : 's' }}
      </p>
      <p v-else class="text-sm text-gray-400 mb-6">No reviews yet for this product.</p>

      <Card v-if="canReview" class="mb-8 bg-gray-50/60">
        <h3 class="text-sm font-bold text-gray-900 mb-3">{{ myReview ? 'Update your review' : 'Write a review' }}</h3>
        <div class="flex items-center gap-1 mb-3">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="text-2xl leading-none transition-colors"
            :class="star <= reviewForm.rating ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'"
            @click="reviewForm.rating = star"
          >
            ★
          </button>
        </div>
        <textarea
          v-model="reviewForm.comment"
          rows="3"
          maxlength="2000"
          placeholder="Share your experience with this product (optional)"
          class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600 transition-colors duration-150 resize-none mb-3"
        />
        <p v-if="reviewError" class="text-sm text-rose-600 mb-3">{{ reviewError }}</p>
        <p v-if="reviewSuccess" class="text-sm text-emerald-600 mb-3">{{ reviewSuccess }}</p>
        <Button size="sm" :loading="submittingReview" @click="submitReview">
          {{ myReview ? 'Update review' : 'Submit review' }}
        </Button>
      </Card>

      <div v-if="reviews.length" class="space-y-5">
        <div v-for="r in reviews" :key="r.id" class="bg-gray-50/60 rounded-2xl p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-amber-500 font-bold text-sm">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
            <span class="text-xs text-gray-400">{{ r.user?.name }} · {{ new Date(r.createdAt).toLocaleDateString() }}</span>
          </div>
          <p v-if="r.comment" class="text-sm text-gray-700 leading-relaxed">{{ r.comment }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
