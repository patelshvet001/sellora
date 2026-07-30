/**
 * DashboardOverview — Stats cards and quick actions for the customer dashboard.
 * Displays key metrics like total orders, wishlist items, reviews, and saved addresses.
 * Includes quick action buttons for common tasks.
 */
<script setup lang="ts">
import { computed } from 'vue';
import { useAddressStore } from '~/stores/address';
import Button from '~/components/ui/Button.vue';

const emit = defineEmits<{
  navigate: [section: string];
}>();

const addressStore = useAddressStore();

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  action?: string;
}

// Placeholder stats — in production these would come from a store/API
const stats = computed<StatItem[]>(() => [
  {
    label: 'Total Orders',
    value: 0,
    icon: '📦',
    color: 'bg-blue-50 text-blue-600',
    action: 'orders',
  },
  {
    label: 'Wishlist Items',
    value: 0,
    icon: '❤️',
    color: 'bg-rose-50 text-rose-600',
    action: 'wishlist',
  },
  {
    label: 'Reviews',
    value: 0,
    icon: '⭐',
    color: 'bg-amber-50 text-amber-600',
    action: 'reviews',
  },
  {
    label: 'Saved Addresses',
    value: addressStore.addresses.length || 0,
    icon: '📍',
    color: 'bg-teal-50 text-teal-600',
    action: 'addresses',
  },
]);

function handleNavigate(section: string) {
  emit('navigate', section);
}
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      <p class="text-sm text-gray-500 mt-1">Welcome back! Here's a summary of your account activity.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="relative bg-white border border-gray-200 rounded-xl p-5 overflow-hidden hover:border-teal-200 hover:shadow-md transition-all duration-300 group cursor-pointer"
        @click="stat.action ? handleNavigate(stat.action) : null"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

        <div class="flex items-center gap-4">
          <!-- Icon -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
            :class="stat.color"
          >
            {{ stat.icon }}
          </div>

          <div class="min-w-0">
            <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ stat.value }}</p>
            <p class="text-xs text-gray-500 mt-0.5 truncate">{{ stat.label }}</p>
          </div>
        </div>

        <!-- Arrow hint on hover -->
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg class="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="relative bg-white border border-gray-200 rounded-xl p-6 overflow-hidden">
      <!-- perforated ticket edge -->
      <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

      <h3 class="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          variant="secondary"
          class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
          @click="handleNavigate('profile')"
        >
          <span class="text-lg">👤</span>
          <span class="text-sm font-medium">Edit Profile</span>
        </Button>

        <Button
          variant="secondary"
          class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
          @click="handleNavigate('addresses')"
        >
          <span class="text-lg">📍</span>
          <span class="text-sm font-medium">Manage Addresses</span>
        </Button>

        <Button
          variant="secondary"
          class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
          @click="handleNavigate('orders')"
        >
          <span class="text-lg">📦</span>
          <span class="text-sm font-medium">View Orders</span>
        </Button>

        <Button
          variant="secondary"
          class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
          @click="handleNavigate('security')"
        >
          <span class="text-lg">🔒</span>
          <span class="text-sm font-medium">Security</span>
        </Button>
      </div>
    </div>

    <!-- Recent Activity Placeholder -->
    <div class="relative bg-white border border-gray-200 rounded-xl p-6 overflow-hidden">
      <!-- perforated ticket edge -->
      <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

      <h3 class="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div class="text-center py-8">
        <div class="text-4xl mb-3">🕐</div>
        <p class="text-sm text-gray-500">No recent activity to show.</p>
        <p class="text-xs text-gray-400 mt-1">Your orders, reviews, and updates will appear here.</p>
      </div>
    </div>
  </div>
</template>

