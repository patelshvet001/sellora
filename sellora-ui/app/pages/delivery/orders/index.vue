<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import Card from '~/components/ui/Card.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Button from '~/components/ui/Button.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useDeliveryStore } from '~/stores/delivery';
import { useDeliveryNav } from '~/composables/useDeliveryNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['DELIVERY_PARTNER'] });
useHead({ title: 'My Deliveries — Sellora' });

const deliveryStore = useDeliveryStore();
const { navItems } = useDeliveryNav();

async function markDelivered(order: any) {
  await deliveryStore.updateStatus(order.id, 'DELIVERED');
}

onMounted(() => deliveryStore.fetchMine());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Delivery Partner" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <h1 class="text-2xl font-black text-gray-900 mb-6">My Deliveries</h1>

      <div v-if="deliveryStore.error" class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">
        {{ deliveryStore.error }}
      </div>

      <div v-if="deliveryStore.loading" class="text-gray-400 text-center py-16">Loading deliveries...</div>
      <EmptyState
        v-else-if="!deliveryStore.mine.length"
        icon="🛵"
        title="No Deliveries Accepted"
        description="You haven't accepted any delivery orders yet."
      />

      <div v-else class="space-y-4">
        <Card v-for="o in deliveryStore.mine" :key="o.id">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-bold text-gray-900">{{ o.orderNumber }}</p>
              <p class="text-xs text-gray-400">Customer: {{ o.customer?.name }} · {{ o.customer?.phone || 'No phone' }}</p>
            </div>
            <StatusBadge :status="o.status" />
          </div>
          <p class="text-sm text-gray-600 mb-4 bg-gray-50/60 p-3 rounded-xl">📍 Address: {{ o.address?.line1 }}, {{ o.address?.city }} - {{ o.address?.pincode }}</p>
          <div class="flex justify-end" v-if="o.status === 'OUT_FOR_DELIVERY'">
            <Button size="sm" variant="success" @click="markDelivered(o)">Mark as Delivered ✓</Button>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
