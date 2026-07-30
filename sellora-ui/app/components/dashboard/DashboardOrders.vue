/**
 * DashboardOrders — Recent orders list for the customer dashboard.
 * Displays order history with status badges, items summary, and quick actions.
 */
<script setup lang="ts">
import Badge from '~/components/ui/Badge.vue';
import Button from '~/components/ui/Button.vue';

// Placeholder data — in production this would come from an orders store/API
interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: number;
  orderNumber: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
}

const orders: Order[] = [
  // No orders yet — showing empty state
];

function statusVariant(status: string): 'warning' | 'info' | 'success' | 'danger' | 'gray' {
  switch (status) {
    case 'pending': return 'warning';
    case 'confirmed': return 'info';
    case 'shipped': return 'info';
    case 'delivered': return 'success';
    case 'cancelled': return 'danger';
    default: return 'gray';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">My Orders</h2>
      <p class="text-sm text-gray-500 mt-1">Track and manage your order history.</p>
    </div>

    <!-- Empty State -->
    <div v-if="orders.length === 0" class="relative bg-white border border-gray-200 rounded-xl p-12 overflow-hidden text-center">
      <!-- perforated ticket edge -->
      <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

      <div class="text-6xl mb-4">📦</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
      <p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        You haven't placed any orders yet. Start shopping and your orders will appear here.
      </p>
      <Button
        as="NuxtLink"
        to="/"
        variant="primary"
        class="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
      >
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Browse Products
      </Button>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="relative bg-white border border-gray-200 rounded-xl p-5 overflow-hidden hover:border-teal-200 hover:shadow-md transition-all duration-300"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <p class="text-sm font-semibold text-gray-900">{{ order.orderNumber }}</p>
              <Badge :variant="statusVariant(order.status)" size="sm">
                {{ order.status.charAt(0).toUpperCase() + order.status.slice(1) }}
              </Badge>
            </div>
            <p class="text-xs text-gray-500">{{ formatDate(order.date) }}</p>
            <p class="text-xs text-gray-600">{{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</p>
          </div>

          <div class="text-right">
            <p class="text-sm font-bold text-gray-900">{{ formatPrice(order.total) }}</p>
            <Button variant="ghost" size="sm" class="text-teal-600 hover:text-teal-700 mt-1">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

