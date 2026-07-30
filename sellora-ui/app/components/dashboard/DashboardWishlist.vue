/**
 * DashboardWishlist — Wishlist items display for the customer dashboard.
 * Shows saved/liked products with option to remove or add to cart.
 */
<script setup lang="ts">
import Button from '~/components/ui/Button.vue';

// Placeholder data — in production this would come from a wishlist store/API
interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

const items: WishlistItem[] = [
  // No items yet — showing empty state
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function removeItem(id: number) {
  // Placeholder — would call wishlist store
  console.log('Remove item:', id);
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">My Wishlist</h2>
      <p class="text-sm text-gray-500 mt-1">Products you've saved for later.</p>
    </div>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="relative bg-white border border-gray-200 rounded-xl p-12 overflow-hidden text-center">
      <!-- perforated ticket edge -->
      <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

      <div class="text-6xl mb-4">❤️</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
      <p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Save your favorite products to your wishlist and come back to them anytime.
      </p>
      <Button
        as="NuxtLink"
        to="/"
        variant="primary"
        class="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
      >
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20.9l-1.4-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.3.8 4.5 2.1A6.5 6.5 0 0 1 16.5 3C19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.1L12 20.9z" />
        </svg>
        Explore Products
      </Button>
    </div>

    <!-- Wishlist Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-teal-200 hover:shadow-md transition-all duration-300 group"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100 z-10"></div>

        <!-- Product Image Placeholder -->
        <div class="aspect-square bg-gray-100 flex items-center justify-center">
          <span class="text-4xl text-gray-300">🖼️</span>
        </div>

        <div class="p-4">
          <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
          <p class="text-lg font-bold text-teal-700 mt-1">{{ formatPrice(item.price) }}</p>

          <div class="flex items-center justify-between mt-3">
            <span
              class="text-xs font-medium"
              :class="item.inStock ? 'text-emerald-600' : 'text-red-500'"
            >
              {{ item.inStock ? 'In Stock' : 'Out of Stock' }}
            </span>

            <div class="flex gap-1">
              <button
                type="button"
                class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove from wishlist"
                @click="removeItem(item.id)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <Button variant="primary" size="sm" class="text-xs rounded-lg">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

