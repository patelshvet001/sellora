<script setup lang="ts">
/**
 * ProductDetail.vue — Reusable product detail component
 * Fetches product by ID, renders full detail page with:
 * - Image gallery with zoom
 * - Pricing, offers, delivery checker
 * - Quantity selector, Add to Cart / Buy Now
 * - Ratings & Reviews section with write/update review
 * - Related products slider (horizontal scroll)
 */
import { ref, computed, onMounted } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';
import { useCartStore } from '~/stores/cart';
import { useAuthStore } from '~/stores/auth';

const props = defineProps<{
  id: string | number;
}>();

const emit = defineEmits<{
  (e: 'loaded', product: any): void;
  (e: 'error', message: string): void;
}>();

const cartStore = useCartStore();
const authStore = useAuthStore();

const product = ref<any>(null);
const loading = ref(true);
const error = ref('');
const justAdded = ref(false);
const quantity = ref(1);
const wishlisted = ref(false);
const zoomStyle = ref({});
const zoomVisible = ref(false);
const pincode = ref('');
const deliveryCheckResult = ref<{ available: boolean; eta: string } | null>(null);
const checkingPincode = ref(false);
const relatedProducts = ref<any[]>([]);
const loadingRelated = ref(true);
const canReview = ref(false);
const myReview = ref<any>(null);
const reviewForm = ref({ rating: 5, comment: '' });
const submittingReview = ref(false);
const reviewError = ref('');
const reviewSuccess = ref('');
const reviewSort = ref<'latest' | 'highest' | 'lowest'>('latest');
const sliderScrollRef = ref<HTMLElement | null>(null);

async function loadProduct() {
  loading.value = true;
  error.value = '';
  quantity.value = 1;
  const { request } = useApi();
  try {
    const res = await request<{ product: any }>(`/products/${props.id}`);
    product.value = res.product;
    emit('loaded', res.product);
    if (authStore.user?.role === 'CUSTOMER') await checkReviewEligibility();
    await loadRelatedProducts();
  } catch (err: any) {
    error.value = err.message || 'Failed to load product details';
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
}

async function loadRelatedProducts() {
  if (!product.value?.categoryId) {
    loadingRelated.value = false;
    return;
  }
  const { request } = useApi();
  try {
    const res = await request<{ products: any[] }>(`/products?category=${product.value.category?.slug || ''}`);
    relatedProducts.value = res.products.filter((p: any) => p.id !== product.value?.id).slice(0, 10);
  } catch {
    relatedProducts.value = [];
  } finally {
    loadingRelated.value = false;
  }
}

async function checkReviewEligibility() {
  if (!product.value) return;
  const { request } = useApi();
  try {
    const res = await request<{ eligible: boolean; existingReview: any }>(
      `/reviews/eligibility?productId=${product.value.id}`, { auth: true }
    );
    canReview.value = res.eligible;
    myReview.value = res.existingReview;
    if (res.existingReview) {
      reviewForm.value = { rating: res.existingReview.rating, comment: res.existingReview.comment || '' };
    }
  } catch {
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
      method: 'POST', auth: true,
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
  cartStore.addItem({
    id: product.value.id, name: product.value.name,
    price: Number(product.value.discountPrice ?? product.value.price),
    image: product.value.imageUrl || '', stock: product.value.stock,
  }, quantity.value);
  justAdded.value = true;
  setTimeout(() => (justAdded.value = false), 1500);
}
function buyNow() {
  addToCart();
  navigateTo('/checkout');
}
function toggleWishlist() {
  wishlisted.value = !wishlisted.value;
}
function shareProduct() {
  if (navigator.share) {
    navigator.share({ title: product.value?.name || 'Check this product', url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
  }
}
function onMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  zoomStyle.value = { transformOrigin: `${x}% ${y}%`, transform: 'scale(2)' };
}
function checkDelivery() {
  if (!pincode.value || pincode.value.length < 6) return;
  checkingPincode.value = true;
  setTimeout(() => {
    deliveryCheckResult.value = { available: true, eta: '3-5 business days' };
    checkingPincode.value = false;
  }, 800);
}

function scrollSlider(direction: 'left' | 'right') {
  if (!sliderScrollRef.value) return;
  const scrollAmount = 300;
  sliderScrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  });
}

const reviews = computed(() => {
  if (!product.value?.reviews) return [];
  const items = [...product.value.reviews];
  if (reviewSort.value === 'highest') items.sort((a: any, b: any) => b.rating - a.rating);
  else if (reviewSort.value === 'lowest') items.sort((a: any, b: any) => a.rating - b.rating);
  else items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
});
const avgRating = computed(() => {
  if (!reviews.value.length) return 0;
  return reviews.value.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.value.length;
});
const ratingDistribution = computed(() => {
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (!product.value?.reviews) return dist;
  product.value.reviews.forEach((r: any) => {
    const key = r.rating as number;
    if (dist[key] !== undefined) dist[key]++;
  });
  return dist;
});
const discountPercent = computed(() => {
  if (!product.value?.discountPrice || !product.value?.price) return 0;
  return Math.round(((Number(product.value.price) - Number(product.value.discountPrice)) / Number(product.value.price)) * 100);
});
const savings = computed(() => {
  if (!product.value?.discountPrice || !product.value?.price) return 0;
  return (Number(product.value.price) - Number(product.value.discountPrice)) * quantity.value;
});

onMounted(loadProduct);
</script>

<template>
  <div class="min-h-screen bg-white pb-24 lg:pb-0">
    <!-- Breadcrumbs -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <nav class="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
        <NuxtLink to="/" class="hover:text-teal-600">Home</NuxtLink>
        <span class="text-gray-300">/</span>
        <NuxtLink to="/shop" class="hover:text-teal-600">Shop</NuxtLink>
        <template v-if="product?.category">
          <span class="text-gray-300">/</span>
          <NuxtLink :to="`/shop?category=${product.category.slug}`" class="hover:text-teal-600">{{ product.category.name }}</NuxtLink>
        </template>
        <template v-if="product">
          <span class="text-gray-300">/</span>
          <span class="text-gray-900 font-medium truncate max-w-[200px]">{{ product.name }}</span>
        </template>
      </nav>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div class="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
        <div class="space-y-4">
          <div class="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          <div class="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div class="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div class="h-20 w-full bg-gray-100 rounded animate-pulse" />
          <div class="h-12 w-full bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div class="max-w-md mx-auto">
        <div class="text-6xl mb-6">:(</div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Product not found</h2>
        <p class="text-gray-500 mb-6">{{ error }}</p>
        <Button to="/shop" as="NuxtLink" size="lg">Browse Products</Button>
      </div>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">

        <!-- Left: Image Gallery -->
        <div class="space-y-4">
          <div
            class="relative aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden cursor-crosshair group"
            @mousemove="onMouseMove" @mouseenter="zoomVisible = true" @mouseleave="zoomVisible = false"
          >
            <img
              v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-200"
              :class="{ 'scale-150': zoomVisible }" :style="zoomVisible ? zoomStyle : {}"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-8xl text-gray-200">no image</div>

            <div class="absolute top-4 left-4 flex flex-col gap-2">
              <div v-if="product.discountPrice" class="bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg">
                -{{ discountPercent }}% OFF
              </div>
              <div v-if="product.stock <= 5 && product.stock > 0" class="bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg">
                Only {{ product.stock }} left
              </div>
            </div>

            <!-- Wishlist & Share on image hover (mobile friendly) -->
            <div class="absolute top-4 right-4 flex flex-col gap-2">
              <button
                class="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-all hover:bg-white"
                :class="wishlisted ? 'text-rose-500' : 'text-gray-500'"
                @click="toggleWishlist"
              >
                <svg class="w-5 h-5" :fill="wishlisted ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                class="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-500 hover:bg-white transition-all"
                @click="shareProduct"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="hidden lg:flex items-center gap-3 pt-2">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-500 transition-all text-sm font-medium"
              :class="{ 'text-rose-500 border-rose-200 bg-rose-50': wishlisted }" @click="toggleWishlist"
            >
              <svg class="w-5 h-5" :fill="wishlisted ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {{ wishlisted ? 'Wishlisted' : 'Wishlist' }}
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-teal-600 transition-all text-sm font-medium"
              @click="shareProduct"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>

        <!-- Right: Product Info -->
        <div class="flex flex-col">
          <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3">
            <span v-if="product.category" class="bg-teal-50 text-teal-700 font-semibold px-3 py-1 rounded-full">{{ product.category.name }}</span>
            <span v-if="product.vendor" class="text-gray-400">|</span>
            <span v-if="product.vendor" class="text-teal-600 font-medium">{{ product.vendor.storeName }}</span>
          </div>

          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">{{ product.name }}</h1>

          <div class="flex items-center gap-2 mb-4">
            <span class="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              {{ avgRating.toFixed(1) }}
              <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>
            </span>
            <span class="text-gray-500 text-sm">{{ reviews.length }} Ratings &amp; Reviews</span>
          </div>

          <!-- Price Section -->
          <div class="bg-gray-50 rounded-2xl p-5 mb-5">
            <div class="flex items-baseline gap-3 mb-1">
              <span class="text-3xl sm:text-4xl font-black text-gray-900">Rs. {{ product.discountPrice ?? product.price }}</span>
              <span v-if="product.discountPrice" class="text-lg text-gray-400 line-through">Rs. {{ product.price }}</span>
              <span v-if="discountPercent > 0" class="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{{ discountPercent }}% off</span>
            </div>
            <p v-if="savings > 0" class="text-sm text-emerald-600 font-medium mt-1">You save Rs. {{ savings.toLocaleString() }} on this order!</p>
            <p class="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>

            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="flex items-start gap-2 text-sm">
                <span class="text-lg">Bank</span>
                <div>
                  <p class="font-semibold text-gray-800 text-sm">Available offers</p>
                  <ul class="text-xs text-gray-600 space-y-1 mt-1">
                    <li><span class="font-medium text-green-600">10% off</span> up to Rs. 75 on HDFC Bank Cards. Min Txn Rs. 750</li>
                    <li><span class="font-medium text-green-600">5% Unlimited Cashback</span> on Flipkart Axis Bank Credit Card</li>
                    <li><span class="font-medium text-green-600">Special Price</span> Get extra Rs. 500 off (price inclusive)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery Checker -->
          <div class="mb-5">
            <div class="flex items-center gap-3">
              <input
                v-model="pincode" type="text" maxlength="6" placeholder="Enter delivery pincode"
                class="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
                @keyup.enter="checkDelivery"
              />
              <button
                class="px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all whitespace-nowrap"
                :disabled="pincode.length < 6 || checkingPincode" @click="checkDelivery"
              >
                {{ checkingPincode ? 'Checking...' : 'Check' }}
              </button>
            </div>
            <div v-if="deliveryCheckResult" class="mt-2 flex items-center gap-2 text-sm">
              <span v-if="deliveryCheckResult.available" class="text-emerald-600 font-semibold flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                Delivery available
              </span>
              <span v-else class="text-rose-600 font-semibold">Delivery not available</span>
              <span class="text-gray-500">- {{ deliveryCheckResult.eta }}</span>
            </div>
          </div>

          <!-- Highlights -->
          <div v-if="product.description" class="mb-5">
            <h3 class="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Highlights
            </h3>
            <ul class="text-sm text-gray-600 space-y-1.5 ml-6 list-disc">
              <li v-for="(line, i) in product.description.split('\n').filter((l: string) => l.trim())" :key="i">{{ line }}</li>
            </ul>
          </div>

          <!-- Specs -->
          <div class="mb-6 bg-gray-50 rounded-2xl p-5">
            <h3 class="text-sm font-bold text-gray-900 mb-3">Specifications</h3>
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div class="text-gray-500">Category</div>
              <div class="text-gray-900 font-medium">{{ product.category?.name || 'N/A' }}</div>
              <div class="text-gray-500">Seller</div>
              <div class="text-gray-900 font-medium">{{ product.vendor?.storeName || 'N/A' }}</div>
              <div class="text-gray-500">Stock</div>
              <div class="text-gray-900 font-medium">
                <span v-if="product.stock > 0" class="text-emerald-600">{{ product.stock }} units</span>
                <span v-else class="text-rose-500">Out of stock</span>
              </div>
              <div class="text-gray-500">SKU</div>
              <div class="text-gray-900 font-medium">#{{ product.id }}</div>
            </div>
          </div>

          <!-- Quantity + Actions (desktop) -->
          <div class="hidden lg:block pt-2 border-t border-gray-100">
            <div class="flex items-center gap-4 mb-4">
              <span class="text-sm font-semibold text-gray-700">Quantity:</span>
              <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  class="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  :disabled="quantity <= 1" @click="decrementQty"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M5 12h14" /></svg>
                </button>
                <span class="w-12 text-center text-base font-bold text-gray-900">{{ quantity }}</span>
                <button
                  type="button"
                  class="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  :disabled="quantity >= product.stock" @click="incrementQty"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M12 5v14m7-7H5" /></svg>
                </button>
              </div>
              <span class="text-xs text-gray-400">{{ product.stock }} available</span>
            </div>

            <div class="flex gap-3">
              <Button size="lg" class="flex-1 text-base py-4" variant="primary" :disabled="product.stock <= 0" @click="addToCart">
                {{ justAdded ? 'Added to Cart' : 'Add to Cart' }}
              </Button>
              <Button size="lg" class="flex-1 text-base py-4" variant="success" :disabled="product.stock <= 0" @click="buyNow">
                Buy Now
              </Button>
            </div>
          </div>

          <!-- Seller Info -->
          <div class="mt-6 pt-5 border-t border-gray-100">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-xl">Store</div>
              <div>
                <p class="font-semibold text-gray-900 text-sm">{{ product.vendor?.storeName || 'Sellora Store' }}</p>
                <p class="text-xs text-gray-500">
                  {{ product.vendor?.city || 'Local Vendor' }} - <span class="text-emerald-600 font-medium">Trusted Seller</span>
                </p>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              <span class="flex items-center gap-1">7 Days Return Policy</span>
              <span class="flex items-center gap-1">Secure Payment</span>
              <span class="flex items-center gap-1">Free Delivery on Rs. 500+</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products Slider -->
      <div class="mt-14 lg:mt-20">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold text-gray-900">You might also like</h2>
          <div v-if="relatedProducts.length > 4" class="hidden sm:flex items-center gap-2">
            <button
              class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-teal-600 transition-all disabled:opacity-30"
              @click="scrollSlider('left')"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-teal-600 transition-all disabled:opacity-30"
              @click="scrollSlider('right')"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="loadingRelated" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div class="aspect-square bg-gray-100" />
            <div class="p-3 space-y-2">
              <div class="h-3 w-3/4 bg-gray-100 rounded" />
              <div class="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          </div>
        </div>

        <!-- Slider -->
        <div
          v-else-if="relatedProducts.length"
          ref="sliderScrollRef"
          class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
          style="scrollbar-width: none; -ms-overflow-style: none;"
        >
          <NuxtLink
            v-for="rp in relatedProducts" :key="rp.id" :to="`/shop/${rp.id}`"
            class="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-w-[160px] sm:min-w-0 sm:w-1/3 lg:w-1/4 flex-shrink-0 snap-start"
          >
            <div class="aspect-square bg-gray-50 overflow-hidden">
              <img v-if="rp.imageUrl" :src="rp.imageUrl" :alt="rp.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl text-gray-200">no image</div>
            </div>
            <div class="p-3">
              <p class="text-xs text-gray-400 truncate">{{ rp.vendor?.storeName || '' }}</p>
              <p class="text-sm font-medium text-gray-900 line-clamp-2 mt-0.5">{{ rp.name }}</p>
              <p class="text-sm font-bold text-gray-900 mt-1">Rs. {{ rp.discountPrice ?? rp.price }}</p>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="text-sm text-gray-500">No related products found yet.</p>
      </div>

      <!-- Ratings & Reviews -->
      <div class="mt-14 lg:mt-20 border-t border-gray-100 pt-10">
        <div class="grid lg:grid-cols-3 gap-8">

          <!-- Rating Summary -->
          <div class="lg:col-span-1">
            <div class="bg-gray-50 rounded-2xl p-6 lg:sticky lg:top-24">
              <h2 class="text-lg font-bold text-gray-900 mb-4">Customer Ratings</h2>
              <div class="text-center mb-4">
                <span class="text-5xl font-black text-gray-900">{{ avgRating.toFixed(1) }}</span>
                <div class="flex items-center justify-center gap-0.5 mt-2">
                  <span v-for="i in 5" :key="i" class="text-xl" :class="i <= Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'">*</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ reviews.length }} ratings</p>
              </div>

              <div class="space-y-2">
                <div v-for="star in 5" :key="star" class="flex items-center gap-2 text-sm">
                  <span class="text-gray-600 w-8 text-right">{{ 6 - star }} star</span>
                  <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-amber-400 rounded-full transition-all"
                      :style="{ width: `${product.reviews?.length ? (((ratingDistribution[6 - star] ?? 0) / product.reviews.length) * 100) : 0}%` }"
                    />
                  </div>
                  <span class="text-gray-400 w-8 text-xs">{{ ratingDistribution[6 - star] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Reviews List -->
          <div class="lg:col-span-2">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-gray-900">Reviews</h2>
              <select v-model="reviewSort" class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600">
                <option value="latest">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>

            <!-- Write Review Card -->
            <Card v-if="canReview" variant="flat" class="mb-6">
              <h3 class="text-sm font-bold text-gray-900 mb-3">{{ myReview ? 'Update your review' : 'Write a review' }}</h3>
              <div class="flex items-center gap-1 mb-3">
                <button
                  v-for="star in 5" :key="star" type="button"
                  class="text-2xl leading-none transition-colors"
                  :class="star <= reviewForm.rating ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'"
                  @click="reviewForm.rating = star"
                >*</button>
              </div>
              <textarea
                v-model="reviewForm.comment" rows="3" maxlength="2000"
                placeholder="Share your experience with this product (optional)"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600 transition-colors duration-150 resize-none mb-3"
              />
              <p v-if="reviewError" class="text-sm text-rose-600 mb-3">{{ reviewError }}</p>
              <p v-if="reviewSuccess" class="text-sm text-emerald-600 mb-3">{{ reviewSuccess }}</p>
              <Button size="sm" :loading="submittingReview" @click="submitReview">
                {{ myReview ? 'Update review' : 'Submit review' }}
              </Button>
            </Card>

            <!-- Reviews -->
            <div v-if="reviews.length" class="space-y-4">
              <div v-for="r in reviews" :key="r.id" class="bg-white border border-gray-100 rounded-2xl p-5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-sm font-bold text-teal-700">
                    {{ (r.user?.name || 'A')[0].toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 text-sm">{{ r.user?.name || 'Anonymous' }}</p>
                    <p class="text-xs text-gray-400">
                      {{ new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                    </p>
                  </div>
                  <span class="text-amber-500 font-bold text-sm ml-auto">{{ r.rating }}/5</span>
                </div>
                <p v-if="r.comment" class="text-sm text-gray-700 leading-relaxed mt-2 pl-12">{{ r.comment }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500">No reviews yet. Be the first to share your thoughts.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile sticky action bar (Add to Cart / Buy Now) -->
    <div
      v-if="product && !loading"
      class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
        <button class="w-9 h-9 flex items-center justify-center text-gray-500 disabled:opacity-40" :disabled="quantity <= 1" @click="decrementQty">-</button>
        <span class="w-8 text-center text-sm font-bold text-gray-900">{{ quantity }}</span>
        <button class="w-9 h-9 flex items-center justify-center text-gray-500 disabled:opacity-40" :disabled="quantity >= product.stock" @click="incrementQty">+</button>
      </div>
      <Button class="flex-1" variant="primary" :disabled="product.stock <= 0" @click="addToCart">
        {{ justAdded ? 'Added' : 'Add to Cart' }}
      </Button>
      <Button class="flex-1" variant="success" :disabled="product.stock <= 0" @click="buyNow">
        Buy Now
      </Button>
    </div>
  </div>
</template>
