<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import Card from '~/components/ui/Card.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Button from '~/components/ui/Button.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useVendorStore } from '~/stores/vendor';
import { useVendorNav } from '~/composables/useVendorNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['VENDOR'] });
useHead({ title: 'My Orders — Sellora Vendor' });

const vendorStore = useVendorStore();
const { navItems } = useVendorNav();

const statusFilter = ref('');

const orderStatuses = [
  { value: '', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

const availableTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
};

function canTransition(status: string): string[] {
  return availableTransitions[status] || [];
}

async function updateStatus(orderId: number, newStatus: string) {
  if (confirm(`Change order status to "${newStatus}"?`)) {
    await vendorStore.updateOrderStatus(orderId, newStatus);
  }
}

const filteredOrders = computed(() => {
  if (!statusFilter.value) return vendorStore.orders;
  return vendorStore.orders.filter((o) => o.status === statusFilter.value);
});

onMounted(() => vendorStore.fetchOrders());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Vendor" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-6xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-black text-gray-900">📦 Orders</h1>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          v-for="s in orderStatuses"
          :key="s.value"
          class="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
          :class="statusFilter === s.value ? 'bg-teal-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
          @click="statusFilter = s.value"
        >
          {{ s.label }}
        </button>
      </div>

      <div v-if="vendorStore.loading" class="text-gray-400 text-center py-16">Loading orders...</div>

      <EmptyState
        v-else-if="!vendorStore.orders.length"
        icon="📦"
        title="No Orders Yet"
        description="When customers purchase your products, their orders will appear here."
      />

      <EmptyState
        v-else-if="!filteredOrders.length"
        icon="🔍"
        title="No Orders Match Filter"
        description="Try selecting a different status filter."
      />

      <div v-else class="space-y-4">
        <Card v-for="order in filteredOrders" :key="order.id" class="p-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-bold text-gray-900">#{{ order.orderNumber }}</h3>
                <StatusBadge :status="order.status" />
              </div>
              <p class="text-sm text-gray-600">
                <span class="font-semibold">Customer:</span> {{ order.customer?.name || 'N/A' }}
              </p>
              <p class="text-sm text-gray-600">
                <span class="font-semibold">Items:</span>
                <span v-for="(item, i) in order.items" :key="item.id">
                  {{ item.product?.name || 'Product' }} (x{{ item.quantity }}){{ i < order.items.length - 1 ? ', ' : '' }}
                </span>
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ new Date(order.createdAt).toLocaleDateString() }} at {{ new Date(order.createdAt).toLocaleTimeString() }}</p>
            </div>

            <div class="text-right shrink-0">
              <p class="text-xl font-black text-gray-900">₹{{ order.total }}</p>
              <p v-if="order.deliveryFee > 0" class="text-xs text-gray-400">+ ₹{{ order.deliveryFee }} delivery</p>
            </div>
          </div>

          <!-- Status Transition Buttons -->
          <div v-if="canTransition(order.status).length" class="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <span class="text-xs text-gray-400 font-semibold self-center mr-2">Update status:</span>
            <Button
              v-for="nextStatus in canTransition(order.status)"
              :key="nextStatus"
              size="sm"
              variant="secondary"
              @click="updateStatus(order.id, nextStatus)"
            >
              Mark as {{ nextStatus.replace(/_/g, ' ') }}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

