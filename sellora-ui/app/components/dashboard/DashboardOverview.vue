<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAddressStore } from '~/stores/address';
import { useOrdersStore } from '~/stores/orders';
import { useBookingsStore } from '~/stores/bookings';
import { useAuthStore } from '~/stores/auth';
import Button from '~/components/ui/Button.vue';

const emit = defineEmits<{
  navigate: [section: string];
}>();

const addressStore = useAddressStore();
const ordersStore = useOrdersStore();
const bookingsStore = useBookingsStore();
const authStore = useAuthStore();

const loading = ref(true);

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  action?: string;
}

const stats = computed<StatItem[]>(() => [
  {
    label: 'Total Orders',
    value: ordersStore.orders.length || 0,
    icon: '📦',
    color: 'bg-blue-50 text-blue-600',
    action: 'orders',
  },
  {
    label: 'Total Bookings',
    value: bookingsStore.bookings.length || 0,
    icon: '📅',
    color: 'bg-purple-50 text-purple-600',
    action: 'bookings',
  },
  {
    label: 'Saved Addresses',
    value: addressStore.addresses.length || 0,
    icon: '📍',
    color: 'bg-teal-50 text-teal-600',
    action: 'addresses',
  },
  {
    label: 'Account Type',
    value: authStore.user?.role === 'CUSTOMER' ? 'Customer' : authStore.user?.role || '—',
    icon: '👤',
    color: 'bg-amber-50 text-amber-600',
  },
]);

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    addressStore.fetchAddresses(),
    ordersStore.fetchMyOrders(),
    bookingsStore.fetchMyBookings(),
  ]);
  loading.value = false;
});

function handleNavigate(section: string) {
  emit('navigate', section);
}
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      <p class="text-sm text-gray-500 mt-1">
        Welcome back, {{ authStore.user?.name || 'User' }}! Here's a summary of your account activity.
      </p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="animate-pulse bg-white border border-gray-200 rounded-2xl p-5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gray-200"></div>
          <div class="space-y-2 flex-1">
            <div class="h-6 bg-gray-200 rounded w-2/3"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loaded content -->
    <template v-else>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="(stat, index) in stats" :key="index"
          class="relative bg-white border border-gray-100 rounded-2xl p-5 hover:border-teal-200 hover:shadow-md transition-all duration-300 group cursor-pointer"
          @click="stat.action ? handleNavigate(stat.action) : null">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
              :class="stat.color">
              {{ stat.icon }}
            </div>
            <div class="min-w-0">
              <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ stat.value }}</p>
              <p class="text-xs text-gray-500 mt-0.5 truncate">{{ stat.label }}</p>
            </div>
            <div v-if="stat.action"
              class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg class="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="relative bg-white border border-gray-100 rounded-2xl p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="secondary" class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
            @click="handleNavigate('profile')">
            <span class="text-lg">👤</span>
            <span class="text-sm font-medium">Edit Profile</span>
          </Button>
          <Button variant="secondary" class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
            @click="handleNavigate('addresses')">
            <span class="text-lg">📍</span>
            <span class="text-sm font-medium">Manage Addresses</span>
          </Button>
          <Button variant="secondary" class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
            @click="handleNavigate('orders')">
            <span class="text-lg">📦</span>
            <span class="text-sm font-medium">View Orders</span>
          </Button>
          <Button variant="secondary" class="w-full justify-start gap-3 py-3 px-4 rounded-xl"
            @click="handleNavigate('security')">
            <span class="text-lg">🔒</span>
            <span class="text-sm font-medium">Security</span>
          </Button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="relative bg-white border border-gray-100 rounded-2xl p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>

        <div v-if="ordersStore.orders.length > 0 || bookingsStore.bookings.length > 0" class="space-y-3">
          <div v-for="o in ordersStore.orders.slice(0, 3)" :key="`order-${o.id}`"
            class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div class="flex items-center gap-3">
              <span class="text-lg">📦</span>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ o.orderNumber }}</p>
                <p class="text-xs text-gray-400">{{ new Date(o.createdAt).toLocaleDateString() }}</p>
              </div>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full"
              :class="o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
              {{ o.status.replace(/_/g, ' ') }}
            </span>
          </div>

          <div v-for="b in bookingsStore.bookings.slice(0, 2)" :key="`booking-${b.id}`"
            class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div class="flex items-center gap-3">
              <span class="text-lg">📅</span>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ b.service?.title || 'Booking' }}</p>
                <p class="text-xs text-gray-400">{{ new Date(b.scheduledAt).toLocaleDateString() }}</p>
              </div>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full"
              :class="b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
              {{ b.status }}
            </span>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="text-4xl mb-3">🕐</div>
          <p class="text-sm text-gray-500">No recent activity to show.</p>
          <p class="text-xs text-gray-400 mt-1">Your orders, bookings, and updates will appear here.</p>
        </div>
      </div>
    </template>
  </div>
</template>