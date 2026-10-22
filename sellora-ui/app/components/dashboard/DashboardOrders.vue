<script setup lang="ts">
import { onMounted, computed } from 'vue';
import Badge from '~/components/ui/Badge.vue';
import Button from '~/components/ui/Button.vue';
import { useOrdersStore } from '~/stores/orders';

const ordersStore = useOrdersStore();

onMounted(() => ordersStore.fetchMyOrders());

const orders = computed(() => ordersStore.orders);

function statusVariant(status: string): 'warning' | 'info' | 'success' | 'danger' | 'gray' {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'CONFIRMED': return 'info';
    case 'PACKED': return 'info';
    case 'OUT_FOR_DELIVERY': return 'info';
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'danger';
    case 'RETURNED': return 'danger';
    default: return 'gray';
  }
}

function formatPrice(price: number): string {
  return '₹' + Number(price).toFixed(2);
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">My Orders</h2>
      <p class="text-sm text-gray-500 mt-1">Track and manage your order history.</p>
    </div>

    <div v-if="ordersStore.loading" class="text-center py-16 text-gray-400">Loading orders...</div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0"
      class="relative bg-white border border-gray-100 rounded-2xl p-12 overflow-hidden text-center">
      <div class="text-6xl mb-4">📦</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
      <p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        You haven't placed any orders yet. Start shopping and your orders will appear here.
      </p>
      <Button as="NuxtLink" to="/shop" variant="primary" class="bg-teal-600 hover:bg-teal-700 text-white">
        Browse Products
      </Button>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id"
        class="relative bg-white border border-gray-100 rounded-2xl p-5 overflow-hidden hover:border-teal-200 hover:shadow-md transition-all duration-300">
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <p class="text-sm font-semibold text-gray-900">{{ order.orderNumber }}</p>
              <Badge :variant="statusVariant(order.status)" size="sm">
                {{ order.status.replace(/_/g, ' ') }}
              </Badge>
            </div>
            <p class="text-xs text-gray-500">{{ new Date(order.createdAt).toLocaleDateString() }}</p>
            <p class="text-xs text-gray-600">{{ order.items?.length || 0 }} item(s)</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-gray-900">{{ formatPrice(order.total) }}</p>
            <NuxtLink :to="`/orders/${order.id}`"
              class="text-xs font-semibold text-teal-600 hover:text-teal-700 mt-1 inline-block">
              View Details →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
