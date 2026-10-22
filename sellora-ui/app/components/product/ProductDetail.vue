<script setup lang="ts">
/**
 * ProductDetail.vue — Warm artisanal product detail page
 * Design inspired by premium DTC brands with:
 * - Cream background, brown accent palette
 * - Image gallery with white container & shadow
 * - Sticky right-column purchase flow
 * - Variant selector, purchase type radios, quantity picker
 * - Trust badges, bundle upsell card
 * - Tabbed content: Description, Reviews, Shipping
 * - Mobile sticky bottom bar
 * - Full reviews with write/update capability
 * - Related products slider
 */
import { ref, computed, onMounted, nextTick } from 'vue';
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

// ─── State ───
const product = ref<any>(null);
const loading = ref(true);
const error = ref('');
const justAdded = ref(false);
const quantity = ref(1);
const wishlisted = ref(false);
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
const activeTab = ref<'description' | 'reviews' | 'shipping'>('description');
const purchaseType = ref<'onetime' | 'subscribe'>('onetime');
const selectedVariant = ref(0);

// ─── API Calls ───
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

// ─── Actions ───
function scrollToReviews() {
  activeTab.value = 'reviews';
  nextTick(() => {
    document
      .getElementById('product-tabs')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  });
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
        navigator.share({ title: product.value?.name || 'Check this product', url: window.location.href }).catch(() => { });
    } else {
        navigator.clipboard.writeText(window.location.href);
    }
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
    sliderScrollRef.value.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
}

// ─── Computed ───
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
    product.value?.reviews?.forEach((r: any) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
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
const currentPrice = computed(() => {
    if (!product.value) return 0;
    const base = Number(product.value.discountPrice ?? product.value.price);
    return purchaseType.value === 'subscribe' ? Math.round(base * 0.85) : base;
});

defineExpose({ loadProduct });
onMounted(loadProduct);
</script>

<template>
    <div class="min-h-screen" style="background-color: #F5F1E8;">

        <!-- ── Top Shipping Banner ── -->
        <div class="w-full py-2 text-center text-xs sm:text-sm font-semibold tracking-wide"
            style="background-color: #E86A33; color: #fff;">
            <svg class="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1 2 1 2-1 2 1m6-6v6m0 0l2 1 2-1 2 1m-6-6h2a1 1 0 011 1v5m-8 0a1 1 0 01-1 1H2a1 1 0 01-1-1V6" />
            </svg>
            FREE SHIPPING ON ORDERS OVER Rs. 499
        </div>

        <!-- ── Breadcrumbs ── -->
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
            <nav class="flex items-center gap-2 text-xs sm:text-sm" style="color: #888;">
                <NuxtLink to="/" class="hover:underline" style="color: #8B5A3C;">Home</NuxtLink>
                <span style="color: #D4C4B0;">/</span>
                <NuxtLink to="/shop" class="hover:underline" style="color: #8B5A3C;">Shop</NuxtLink>
                <template v-if="product?.category">
                    <span style="color: #D4C4B0;">/</span>
                    <NuxtLink :to="'/shop?category=' + product.category.slug" class="hover:underline"
                        style="color: #8B5A3C;">{{ product.category.name }}</NuxtLink>
                </template>
                <template v-if="product">
                    <span style="color: #D4C4B0;">/</span>
                    <span class="font-medium truncate max-w-[180px]" style="color: #2C2416;">{{ product.name }}</span>
                </template>
            </nav>
        </div>

        <!-- ── Loading Skeleton ── -->
        <div v-if="loading" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid lg:grid-cols-2 gap-10">
                <div class="aspect-square rounded-sm animate-pulse" style="background: #E8E2D6;" />
                <div class="space-y-5">
                    <div class="h-5 w-28 animate-pulse rounded" style="background: #E8E2D6;" />
                    <div class="h-9 w-3/4 animate-pulse rounded" style="background: #E8E2D6;" />
                    <div class="h-12 w-1/3 animate-pulse rounded" style="background: #E8E2D6;" />
                    <div class="h-20 w-full animate-pulse rounded" style="background: #E8E2D6;" />
                    <div class="h-14 w-full animate-pulse rounded" style="background: #E8E2D6;" />
                </div>
            </div>
        </div>

        <!-- ── Error ── -->
        <div v-else-if="error" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <div class="max-w-md mx-auto">
                <div class="text-6xl mb-6">:(</div>
                <h2 class="text-xl font-bold mb-2" style="color: #2C2416;">Product not found</h2>
                <p class="mb-6" style="color: #888;">{{ error }}</p>
                <NuxtLink to="/shop"
                    class="inline-block px-8 py-3 rounded text-sm font-bold tracking-wide text-white transition-colors"
                    style="background-color: #8B5A3C;">
                    BROWSE PRODUCTS
                </NuxtLink>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════ -->
        <!-- ── PRODUCT DETAIL ── -->
        <!-- ══════════════════════════════════════════════ -->
        <div v-else-if="product" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 lg:pb-16">
            <div class="grid lg:grid-cols-2 gap-8 lg:gap-14">

                <!-- ══ LEFT COLUMN: Image Gallery ══ -->
                <div class="space-y-4">
                    <!-- Main Image Container -->
                    <div class="relative bg-white rounded-sm overflow-hidden"
                        style="box-shadow: 0 4px 16px rgba(44,36,22,0.08);">
                        <!-- Discount Badge -->
                        <div v-if="product.discountPrice"
                            class="absolute top-4 left-4 z-10 text-white font-bold text-xs px-3 py-1.5 rounded-full"
                            style="background-color: #E86A33;">
                            {{ discountPercent }}% OFF
                        </div>
                        <!-- Low Stock Badge -->
                        <div v-if="product.stock <= 5 && product.stock > 0"
                            class="absolute top-4 left-4 z-10 text-white font-bold text-xs px-3 py-1.5 rounded-full"
                            :style="{ backgroundColor: product.discountPrice ? '#D4A053' : '#E86A33', marginLeft: product.discountPrice ? '110px' : '0' }">
                            Only {{ product.stock }} left
                        </div>
                        <!-- Wishlist & Share -->
                        <div class="absolute top-4 right-4 z-10 flex flex-col gap-2">
                            <button
                                class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center transition-all hover:bg-white"
                                :style="{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }" @click="toggleWishlist">
                                <svg class="w-5 h-5" :fill="wishlisted ? '#E86A33' : 'none'" viewBox="0 0 24 24"
                                    :stroke="wishlisted ? '#E86A33' : '#888'" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                            <button
                                class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:bg-white transition-all"
                                :style="{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }" @click="shareProduct">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#888" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                        </div>
                        <!-- Image -->
                        <!-- <div class="aspect-square flex items-center justify-center p-8 sm:p-12">
                            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name"
                                class="w-full h-full object-contain" />
                            <div v-else class="text-6xl" style="color: #D4C4B0;">No Image</div>
                        </div> -->
                        <product-image-zoom :src="product.imageUrl" :alt="product.name" />
                    </div>

                    <!-- Wishlist & Share Buttons (below image) -->
                    <div class="hidden lg:flex items-center gap-3 pt-1">
                        <button
                            class="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-all border"
                            :class="wishlisted ? 'text-white' : ''" :style="wishlisted
                                ? { backgroundColor: '#8B5A3C', borderColor: '#8B5A3C', color: '#fff' }
                                : { backgroundColor: '#fff', borderColor: '#D4C4B0', color: '#666' }" @click="toggleWishlist">
                            <svg class="w-4 h-4" :fill="wishlisted ? 'currentColor' : 'none'" viewBox="0 0 24 24"
                                stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {{ wishlisted ? 'Wishlisted' : 'Wishlist' }}
                        </button>
                        <button
                            class="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-all border"
                            style="background-color: #fff; border-color: #D4C4B0; color: #666;" @click="shareProduct">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                    </div>
                </div>

                <!-- ══ RIGHT COLUMN: Purchase Flow (Sticky on desktop) ══ -->
                <div class="lg:sticky lg:top-6 lg:self-start space-y-5">

                    <!-- Category & Vendor -->
                    <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span v-if="product.category" class="font-semibold px-3 py-1 rounded-full text-white"
                            style="background-color: #8B5A3C;">
                            {{ product.category.name }}
                        </span>
                        <span v-if="product.vendor" style="color: #D4C4B0;">|</span>
                        <span v-if="product.vendor" class="font-medium" style="color: #8B5A3C;">{{
                            product.vendor.storeName
                            }}</span>
                    </div>

                    <!-- Product Title -->
                    <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight" style="color: #2C2416;">
                        {{ product.name }}
                    </h1>

                    <!-- Rating Summary -->
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold px-2.5 py-1 rounded flex items-center gap-1"
                            style="background-color: #2C2416; color: #F4B400;">
                            {{ avgRating.toFixed(1) }}
                            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                            </svg>
                        </span>
                        <span class="text-sm" style="color: #888;">{{ reviews.length }} Ratings & Reviews</span>
                        <button v-if="reviews.length" class="ml-auto text-xs font-semibold underline"
                            style="color: #8B5A3C;"
                            @click="scrollToReviews">
                            Read Reviews
                        </button>
                    </div>

                    <!-- ── Price Block ── -->
                    <div class="bg-white rounded-sm p-5" style="border: 1px solid #E0D5C5;">
                        <div class="flex items-baseline gap-3 mb-1">
                            <span class="text-3xl sm:text-4xl font-black" style="color: #2C2416;">Rs. {{
                                currentPrice.toLocaleString() }}</span>
                            <span v-if="product.discountPrice" class="text-base line-through"
                                style="color: #B0A090;">Rs. {{
                                    Number(product.price).toLocaleString() }}</span>
                        </div>
                        <p class="text-xs font-semibold tracking-widest uppercase" style="color: #999;">Unit Price</p>
                        <p v-if="savings > 0 && purchaseType === 'onetime'" class="text-sm font-medium mt-2"
                            style="color: #4A7C59;">
                            You save Rs. {{ savings.toLocaleString() }} on this order!
                        </p>
                        <p class="text-xs mt-1" style="color: #B0A090;">Inclusive of all taxes</p>
                    </div>

                    <!-- ── Variant Selector (pack size) ── -->
                    <div>
                        <div class="flex items-center justify-between px-4 py-3 rounded cursor-pointer transition-colors"
                            style="background-color: #A0522D; color: #fff;">
                            <span class="text-sm font-semibold">1 Unit — Rs. {{ (product.discountPrice ??
                                product.price).toLocaleString() }}</span>
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <!-- ── Purchase Type (Radio) ── -->
                    <div class="space-y-2">
                        <label class="flex items-start gap-3 px-4 py-3 bg-white rounded cursor-pointer transition-all"
                            style="border: 1px solid #E0D5C5;"
                            :style="purchaseType === 'onetime' ? { borderColor: '#8B5A3C', boxShadow: '0 0 0 1px #8B5A3C' } : {}">
                            <div class="mt-0.5">
                                <div v-if="purchaseType === 'onetime'"
                                    class="w-5 h-5 rounded-full flex items-center justify-center"
                                    style="background-color: #8B5A3C;">
                                    <div class="w-2 h-2 rounded-full bg-white" />
                                </div>
                                <div v-else class="w-5 h-5 rounded-full" style="border: 2px solid #CCC;" />
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-semibold" style="color: #2C2416;">One-Time Purchase</p>
                                <p class="text-sm font-bold" style="color: #8B5A3C;">Rs. {{ (product.discountPrice ??
                                    product.price).toLocaleString() }}</p>
                            </div>
                            <input v-model="purchaseType" type="radio" value="onetime" class="sr-only" />
                        </label>
                        <label class="flex items-start gap-3 px-4 py-3 bg-white rounded cursor-pointer transition-all"
                            style="border: 1px solid #E0D5C5;"
                            :style="purchaseType === 'subscribe' ? { borderColor: '#8B5A3C', boxShadow: '0 0 0 1px #8B5A3C' } : {}">
                            <div class="mt-0.5">
                                <div v-if="purchaseType === 'subscribe'"
                                    class="w-5 h-5 rounded-full flex items-center justify-center"
                                    style="background-color: #8B5A3C;">
                                    <div class="w-2 h-2 rounded-full bg-white" />
                                </div>
                                <div v-else class="w-5 h-5 rounded-full" style="border: 2px solid #CCC;" />
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-semibold" style="color: #2C2416;">Subscribe & Save <span
                                        class="font-bold" style="color: #4A7C59;">(15%)</span></p>
                                <p class="text-sm font-bold" style="color: #8B5A3C;">Rs. {{
                                    Math.round(Number(product.discountPrice ?? product.price) * 0.85).toLocaleString()
                                    }}</p>
                            </div>
                            <input v-model="purchaseType" type="radio" value="subscribe" class="sr-only" />
                        </label>
                    </div>

                    <!-- ── Quantity Selector ── -->
                    <div class="flex items-center gap-4">
                        <span class="text-sm font-semibold" style="color: #2C2416;">Quantity:</span>
                        <div class="flex items-center overflow-hidden" style="border: 1px solid #D4C4B0;">
                            <button type="button"
                                class="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                style="background-color: #F0ECE4; color: #666;" :disabled="quantity <= 1"
                                @click="decrementQty">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="2.5">
                                    <path stroke-linecap="round" d="M5 12h14" />
                                </svg>
                            </button>
                            <span class="w-12 text-center text-base font-bold" style="color: #2C2416;">{{ quantity
                                }}</span>
                            <button type="button"
                                class="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                style="background-color: #F0ECE4; color: #666;" :disabled="quantity >= product.stock"
                                @click="incrementQty">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="2.5">
                                    <path stroke-linecap="round" d="M12 5v14m7-7H5" />
                                </svg>
                            </button>
                        </div>
                        <span class="text-xs" style="color: #999;">{{ product.stock }} available</span>
                    </div>

                    <!-- ── CTA Buttons (desktop) ── -->
                    <div class="hidden lg:block space-y-3">
                        <button
                            class="w-full py-4 rounded text-sm font-bold tracking-wider uppercase text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            :style="{ backgroundColor: justAdded ? '#4A7C59' : '#8B5A3C' }"
                            :disabled="product.stock <= 0" @click="addToCart">
                            {{ product.stock <= 0 ? 'OUT OF STOCK' : (justAdded ? 'ADDED TO CART!' : `ADD TO CART: RS.
                                ${(currentPrice * quantity).toLocaleString()}`) }} </button>
                                <button
                                    class="w-full py-4 rounded text-sm font-bold tracking-wider uppercase text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style="background-color: #2C2416;" :disabled="product.stock <= 0" @click="buyNow">
                                    BUY NOW
                                </button>
                    </div>

                    <!-- ── Delivery Checker ── -->
                    <div>
                        <div class="flex items-center gap-2">
                            <input v-model="pincode" type="text" maxlength="6" placeholder="Enter delivery pincode"
                                class="flex-1 px-4 py-3 text-sm rounded focus:outline-none transition-all"
                                style="border: 1px solid #D4C4B0; background-color: #fff;"
                                onfocus="this.style.borderColor='#8B5A3C'; this.style.boxShadow='0 0 0 2px rgba(139,90,60,0.15)'"
                                onblur="this.style.borderColor='#D4C4B0'; this.style.boxShadow='none'"
                                @keyup.enter="checkDelivery" />
                            <button
                                class="px-5 py-3 text-white rounded text-sm font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
                                style="background-color: #8B5A3C;" :disabled="pincode.length < 6 || checkingPincode"
                                @click="checkDelivery">
                                {{ checkingPincode ? '...' : 'CHECK' }}
                            </button>
                        </div>
                        <div v-if="deliveryCheckResult" class="mt-2 flex items-center gap-2 text-sm">
                            <span v-if="deliveryCheckResult.available" class="font-semibold flex items-center gap-1"
                                style="color: #4A7C59;">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Delivery available
                            </span>
                            <span v-else class="font-semibold" style="color: #C0392B;">Delivery not available</span>
                            <span style="color: #999;">— {{ deliveryCheckResult.eta }}</span>
                        </div>
                    </div>

                    <!-- ── Trust Badges ── -->
                    <div class="flex items-center justify-between py-3">
                        <div class="flex flex-col items-center gap-1.5">
                            <div class="w-11 h-11 rounded-full flex items-center justify-center"
                                style="border: 2px solid #D4C4B0;">
                                <svg class="w-5 h-5" style="color: #8B5A3C;" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span class="text-[10px] font-semibold uppercase tracking-wider"
                                style="color: #999;">Secure</span>
                        </div>
                        <div class="flex flex-col items-center gap-1.5">
                            <div class="w-11 h-11 rounded-full flex items-center justify-center"
                                style="border: 2px solid #D4C4B0;">
                                <svg class="w-5 h-5" style="color: #8B5A3C;" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: #999;">Easy
                                Return</span>
                        </div>
                        <div class="flex flex-col items-center gap-1.5">
                            <div class="w-11 h-11 rounded-full flex items-center justify-center"
                                style="border: 2px solid #D4C4B0;">
                                <svg class="w-5 h-5" style="color: #8B5A3C;" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <span class="text-[10px] font-semibold uppercase tracking-wider"
                                style="color: #999;">Authentic</span>
                        </div>
                        <div class="flex flex-col items-center gap-1.5">
                            <div class="w-11 h-11 rounded-full flex items-center justify-center"
                                style="border: 2px solid #D4C4B0;">
                                <svg class="w-5 h-5" style="color: #8B5A3C;" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1 2 1 2-1 2 1m6-6v6m0 0l2 1 2-1 2 1" />
                                </svg>
                            </div>
                            <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: #999;">Free
                                Ship</span>
                        </div>
                    </div>

                    <!-- ── Bundle Upsell Card ── -->
                    <div class="rounded-sm p-4 flex items-center gap-4"
                        style="background-color: #FFF8E7; border: 1px solid #E0D5C5;">
                        <div class="shrink-0">
                            <svg class="w-10 h-10" style="color: #8B5A3C;" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="text-xs font-bold uppercase tracking-wider" style="color: #8B5A3C;">Build a Bundle
                                & Save
                                More</p>
                            <p class="text-sm mt-1" style="color: #666;">Mix & match products for extra discounts on
                                your order.
                            </p>
                        </div>
                    </div>

                    <!-- ── Seller Info ── -->
                    <div class="flex items-center gap-3 pt-3" style="border-top: 1px solid #E0D5C5;">
                        <div class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style="background-color: #8B5A3C;">
                            {{ (product.vendor?.storeName || 'S')[0] }}
                        </div>
                        <div>
                            <p class="font-semibold text-sm" style="color: #2C2416;">{{ product.vendor?.storeName || 'Sellora Store' }}</p>
                            <p class="text-xs" style="color: #999;">{{ product.vendor?.city || 'Local Vendor' }} · <span
                                    style="color: #4A7C59;" class="font-medium">Trusted Seller</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ══════════════════════════════════════════════ -->
            <!-- ── TABBED CONTENT SECTION ── -->
            <!-- ══════════════════════════════════════════════ -->
            <div id="product-tabs" class="mt-14 lg:mt-20">
                <!-- Tab Headers -->
                <div class="flex" style="border-bottom: 2px solid #E0D5C5;">
                    <button v-for="tab in (['description', 'reviews', 'shipping'] as const)" :key="tab"
                        class="px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-colors" :style="activeTab === tab
                            ? { color: '#8B5A3C', borderBottom: '3px solid #8B5A3C', marginBottom: '-2px' }
                            : { color: '#999' }" @click="activeTab = tab">
                        {{ tab === 'description' ? 'DESCRIPTION' : tab === 'reviews' ? `REVIEWS (${reviews.length})` : 'SHIPPING & RETURNS' }}
                    </button>
                </div>

                <!-- Tab: Description -->
                <div v-show="activeTab === 'description'" class="py-8">
                    <div class="grid lg:grid-cols-3 gap-8">
                        <!-- Main Description -->
                        <div class="lg:col-span-2">
                            <h3 class="text-lg font-bold mb-3" style="color: #2C2416;">About This Product</h3>
                            <div v-if="product.description" class="space-y-2">
                                <p v-for="(line, i) in product.description.split('\n').filter((l: string) => l.trim())"
                                    :key="i" class="text-sm leading-relaxed" style="color: #4A4A4A;">{{ line }}</p>
                            </div>
                            <p v-else class="text-sm" style="color: #999;">No description available for this product
                                yet.</p>
                        </div>
                        <!-- Specs Table -->
                        <div>
                            <h4 class="text-sm font-bold uppercase tracking-wider mb-4" style="color: #2C2416;">
                                Specifications
                            </h4>
                            <div class="space-y-0" style="border: 1px solid #E0D5C5;">
                                <div class="flex text-sm" style="border-bottom: 1px solid #E0D5C5;">
                                    <span class="w-28 px-3 py-2.5 font-medium"
                                        style="background-color: #FAF8F3; color: #666;">Category</span>
                                    <span class="flex-1 px-3 py-2.5" style="color: #2C2416;">{{ product.category?.name
                                        || 'N/A'
                                        }}</span>
                                </div>
                                <div class="flex text-sm" style="border-bottom: 1px solid #E0D5C5;">
                                    <span class="w-28 px-3 py-2.5 font-medium"
                                        style="background-color: #FAF8F3; color: #666;">Seller</span>
                                    <span class="flex-1 px-3 py-2.5" style="color: #2C2416;">{{
                                        product.vendor?.storeName ||
                                        'N/A' }}</span>
                                </div>
                                <div class="flex text-sm" style="border-bottom: 1px solid #E0D5C5;">
                                    <span class="w-28 px-3 py-2.5 font-medium"
                                        style="background-color: #FAF8F3; color: #666;">Stock</span>
                                    <span class="flex-1 px-3 py-2.5"
                                        :style="{ color: product.stock > 0 ? '#4A7C59' : '#C0392B' }">
                                        {{ product.stock > 0 ? `${product.stock} units available` : 'Out of stock' }}
                                    </span>
                                </div>
                                <div class="flex text-sm">
                                    <span class="w-28 px-3 py-2.5 font-medium"
                                        style="background-color: #FAF8F3; color: #666;">SKU</span>
                                    <span class="flex-1 px-3 py-2.5" style="color: #2C2416;">#{{ product.id }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Highlights -->
                    <div v-if="product.description" class="mt-8">
                        <h4 class="text-sm font-bold uppercase tracking-wider mb-3" style="color: #2C2416;">Highlights
                        </h4>
                        <ul class="grid sm:grid-cols-2 gap-2">
                            <li v-for="(line, i) in product.description.split('\n').filter((l: string) => l.trim()).slice(0, 6)"
                                :key="i" class="flex items-start gap-2 text-sm" style="color: #4A4A4A;">
                                <svg class="w-4 h-4 mt-0.5 shrink-0" style="color: #4A7C59;" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {{ line }}
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Tab: Reviews -->
                <div v-show="activeTab === 'reviews'" class="py-8">
                    <div class="grid lg:grid-cols-3 gap-8">
                        <!-- Rating Summary -->
                        <div class="lg:col-span-1">
                            <div class="bg-white rounded-sm p-6 lg:sticky lg:top-24" style="border: 1px solid #E0D5C5;">
                                <h2 class="text-lg font-bold mb-4" style="color: #2C2416;">Customer Ratings</h2>
                                <div class="text-center mb-5">
                                    <span class="text-5xl font-black" style="color: #2C2416;">{{ avgRating.toFixed(1)
                                        }}</span>
                                    <div class="flex items-center justify-center gap-0.5 mt-2">
                                        <svg v-for="i in 5" :key="i" class="w-5 h-5"
                                            :style="{ color: i <= Math.round(avgRating) ? '#F4B400' : '#E0D5C5' }"
                                            fill="currentColor" viewBox="0 0 24 24">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <p class="text-sm mt-1" style="color: #999;">{{ reviews.length }} ratings</p>
                                </div>
                                <div class="space-y-2.5">
                                    <div v-for="star in 5" :key="star" class="flex items-center gap-2 text-sm">
                                        <span class="w-8 text-right" style="color: #666;">{{ 6 - star }}</span>
                                        <svg class="w-3.5 h-3.5 shrink-0" style="color: #F4B400;" fill="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                                        </svg>
                                        <div class="flex-1 h-2 rounded-full overflow-hidden"
                                            style="background-color: #E8E2D6;">
                                            <div class="h-full rounded-full" style="background-color: #F4B400;"
                                                :style="{ width: `${product.reviews?.length ? (((ratingDistribution[6 - star] ?? 0) / product.reviews.length) * 100) : 0}%` }" />
                                        </div>
                                        <span class="w-6 text-xs" style="color: #999;">{{ ratingDistribution[6 - star]
                                            ?? 0
                                            }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Reviews List -->
                        <div class="lg:col-span-2">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-lg font-bold" style="color: #2C2416;">Reviews</h2>
                                <select v-model="reviewSort" class="text-sm rounded px-3 py-1.5 focus:outline-none"
                                    style="border: 1px solid #D4C4B0; background-color: #fff; color: #4A4A4A;">
                                    <option value="latest">Most Recent</option>
                                    <option value="highest">Highest Rated</option>
                                    <option value="lowest">Lowest Rated</option>
                                </select>
                            </div>

                            <!-- Write Review Card -->
                            <div v-if="canReview" class="bg-white rounded-sm p-5 mb-6"
                                style="border: 1px solid #E0D5C5;">
                                <h3 class="text-sm font-bold mb-3" style="color: #2C2416;">{{ myReview ? 'Update your review' : 'Write a review' }}</h3>
                                <div class="flex items-center gap-1 mb-3">
                                    <button v-for="star in 5" :key="star" type="button"
                                        class="text-2xl leading-none transition-colors"
                                        @click="reviewForm.rating = star">
                                        <svg class="w-7 h-7"
                                            :style="{ color: star <= reviewForm.rating ? '#F4B400' : '#E0D5C5' }"
                                            fill="currentColor" viewBox="0 0 24 24">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                                        </svg>
                                    </button>
                                </div>
                                <textarea v-model="reviewForm.comment" rows="3" maxlength="2000"
                                    placeholder="Share your experience with this product (optional)"
                                    class="w-full rounded px-3 py-2.5 text-sm outline-none transition-colors resize-none mb-3"
                                    style="border: 1px solid #D4C4B0; color: #2C2416;"
                                    onfocus="this.style.borderColor='#8B5A3C'"
                                    onblur="this.style.borderColor='#D4C4B0'" />
                                <p v-if="reviewError" class="text-sm mb-3" style="color: #C0392B;">{{ reviewError }}</p>
                                <p v-if="reviewSuccess" class="text-sm mb-3" style="color: #4A7C59;">{{ reviewSuccess }}
                                </p>
                                <button
                                    class="px-6 py-2.5 rounded text-sm font-bold tracking-wider text-white transition-colors"
                                    :style="{ backgroundColor: submittingReview ? '#A0522D' : '#8B5A3C' }"
                                    :disabled="submittingReview" @click="submitReview">
                                    {{ submittingReview ? 'Submitting...' : (myReview ? 'UPDATE REVIEW' : 'SUBMIT REVIEW') }}
                                </button>
                            </div>

                            <!-- Reviews -->
                            <div v-if="reviews.length" class="space-y-4">
                                <div v-for="r in reviews" :key="r.id" class="bg-white rounded-sm p-5 transition-colors"
                                    style="border: 1px solid #E0D5C5; border-left: 4px solid #8B5A3C;">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                            style="background-color: #8B5A3C;">
                                            {{ (r.user?.name || 'A')[0].toUpperCase() }}
                                        </div>
                                        <div>
                                            <p class="font-semibold text-sm" style="color: #2C2416;">{{ r.user?.name ||
                                                'Anonymous' }}</p>
                                            <p class="text-xs" style="color: #999;">{{ new
                                                Date(r.createdAt).toLocaleDateString('en-IN', {
                                                    year: 'numeric', month:
                                                'short',
                                                day: 'numeric' }) }}</p>
                                        </div>
                                        <div class="ml-auto flex items-center gap-1">
                                            <svg v-for="i in 5" :key="i" class="w-3.5 h-3.5"
                                                :style="{ color: i <= r.rating ? '#F4B400' : '#E0D5C5' }"
                                                fill="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p v-if="r.comment" class="text-sm leading-relaxed mt-2 pl-12"
                                        style="color: #4A4A4A;">{{
                                        r.comment }}</p>
                                </div>
                            </div>
                            <p v-else class="text-sm" style="color: #999;">No reviews yet. Be the first to share your
                                thoughts.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Tab: Shipping -->
                <div v-show="activeTab === 'shipping'" class="py-8">
                    <div class="max-w-2xl space-y-6">
                        <div>
                            <h3 class="text-sm font-bold uppercase tracking-wider mb-2" style="color: #2C2416;">Shipping
                                Policy
                            </h3>
                            <p class="text-sm leading-relaxed" style="color: #4A4A4A;">We offer free standard shipping
                                on all
                                orders above Rs. 499. Orders below this amount are subject to a flat shipping fee of Rs.
                                49.
                                Standard delivery typically takes 3-5 business days depending on your location. Express
                                delivery
                                options are available at checkout for an additional fee.</p>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold uppercase tracking-wider mb-2" style="color: #2C2416;">Return
                                Policy
                            </h3>
                            <p class="text-sm leading-relaxed" style="color: #4A4A4A;">We accept returns within 7 days
                                of
                                delivery for most products. Items must be unused, in their original packaging, and in
                                the same
                                condition as received. Perishable goods, personal care items, and custom orders are
                                non-returnable. To initiate a return, please contact our support team with your order
                                number.
                            </p>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold uppercase tracking-wider mb-2" style="color: #2C2416;">Refund
                                Policy
                            </h3>
                            <p class="text-sm leading-relaxed" style="color: #4A4A4A;">Refunds are processed within 5-7
                                business
                                days after we receive and inspect the returned item. The refund will be credited to your
                                original payment method. For COD orders, refunds are processed via bank transfer or
                                store
                                credit.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ══════════════════════════════════════════════ -->
            <!-- ── RELATED PRODUCTS SLIDER ── -->
            <!-- ══════════════════════════════════════════════ -->
            <div class="mt-14 lg:mt-20">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-lg font-bold" style="color: #2C2416;">You Might Also Like</h2>
                    <div v-if="relatedProducts.length > 4" class="hidden sm:flex items-center gap-2">
                        <button class="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                            style="border: 1px solid #D4C4B0; color: #666;" @click="scrollSlider('left')">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button class="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                            style="border: 1px solid #D4C4B0; color: #666;" @click="scrollSlider('right')">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Loading Skeleton -->
                <div v-if="loadingRelated" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div v-for="i in 4" :key="i" class="bg-white rounded-sm overflow-hidden animate-pulse"
                        style="border: 1px solid #E0D5C5;">
                        <div class="aspect-square" style="background-color: #E8E2D6;" />
                        <div class="p-3 space-y-2">
                            <div class="h-3 w-3/4 rounded" style="background-color: #E8E2D6;" />
                            <div class="h-3 w-1/2 rounded" style="background-color: #E8E2D6;" />
                        </div>
                    </div>
                </div>

                <!-- Slider -->
                <div v-else-if="relatedProducts.length" ref="sliderScrollRef"
                    class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
                    style="scrollbar-width: none; -ms-overflow-style: none;">
                    <NuxtLink v-for="rp in relatedProducts" :key="rp.id" :to="'/shop/' + rp.id"
                        class="group bg-white rounded-sm overflow-hidden transition-all duration-200 min-w-[160px] sm:min-w-0 sm:w-1/3 lg:w-1/4 flex-shrink-0 snap-start hover:-translate-y-0.5"
                        style="border: 1px solid #E0D5C5;">
                        <div class="aspect-square overflow-hidden" style="background-color: #FAF8F3;">
                            <img v-if="rp.imageUrl" :src="rp.imageUrl" :alt="rp.name"
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div v-else class="w-full h-full flex items-center justify-center text-3xl"
                                style="color: #D4C4B0;">
                                No Image</div>
                        </div>
                        <div class="p-3">
                            <p class="text-xs truncate" style="color: #999;">{{ rp.vendor?.storeName || '' }}</p>
                            <p class="text-sm font-medium line-clamp-2 mt-0.5" style="color: #2C2416;">{{ rp.name }}</p>
                            <p class="text-sm font-bold mt-1" style="color: #2C2416;">Rs. {{ (rp.discountPrice ??
                                rp.price).toLocaleString() }}</p>
                        </div>
                    </NuxtLink>
                </div>
                <p v-else class="text-sm" style="color: #999;">No related products found yet.</p>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════ -->
        <!-- ── MOBILE STICKY BOTTOM BAR ── -->
        <!-- ══════════════════════════════════════════════ -->
        <div v-if="product && !loading"
            class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white px-4 py-3 flex items-center gap-3"
            style="border-top: 1px solid #E0D5C5; box-shadow: 0 -4px 16px rgba(44,36,22,0.08);">
            <div class="flex items-center overflow-hidden shrink-0" style="border: 1px solid #D4C4B0;">
                <button class="w-9 h-9 flex items-center justify-center disabled:opacity-40"
                    style="background-color: #F0ECE4; color: #666;" :disabled="quantity <= 1"
                    @click="decrementQty">-</button>
                <span class="w-8 text-center text-sm font-bold" style="color: #2C2416;">{{ quantity }}</span>
                <button class="w-9 h-9 flex items-center justify-center disabled:opacity-40"
                    style="background-color: #F0ECE4; color: #666;" :disabled="quantity >= product.stock"
                    @click="incrementQty">+</button>
            </div>
            <button
                class="flex-1 py-3 rounded text-xs font-bold tracking-wider uppercase text-white transition-colors disabled:opacity-50"
                :style="{ backgroundColor: justAdded ? '#4A7C59' : '#8B5A3C' }" :disabled="product.stock <= 0"
                @click="addToCart">
                {{ justAdded ? 'ADDED!' : 'ADD TO CART' }}
            </button>
            <button
                class="flex-1 py-3 rounded text-xs font-bold tracking-wider uppercase text-white transition-colors disabled:opacity-50"
                style="background-color: #2C2416;" :disabled="product.stock <= 0" @click="buyNow">
                BUY NOW
            </button>
        </div>
    </div>
</template>