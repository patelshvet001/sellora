<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import Card from '~/components/ui/Card.vue';
import StatCard from '~/components/ui/StatCard.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Button from '~/components/ui/Button.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useDeliveryStore } from '~/stores/delivery';
import { useDeliveryNav } from '~/composables/useDeliveryNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['DELIVERY_PARTNER'] });
useHead({ title: 'Delivery Dashboard — Sellora' });

const deliveryStore = useDeliveryStore();
const { navItems } = useDeliveryNav();

async function accept(order: any) {
  await deliveryStore.accept(order.id);
}

onMounted(() => {
  deliveryStore.fetchStats();
  deliveryStore.fetchAvailable();
});
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Delivery Partner" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-black text-gray-900">Available Orders</h1>
        <div class="flex items-center gap-3">
          <StatusBadge v-if="deliveryStore.stats" :status="deliveryStore.stats.isApproved ? 'APPROVED' : 'PENDING'" size="md" />
          <Button size="sm" variant="secondary" @click="deliveryStore.fetchAvailable()">Refresh</Button>
        </div>
      </div>

      <div v-if="deliveryStore.stats && !deliveryStore.stats.isApproved" class="mb-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm px-5 py-4">
        <p class="font-bold">⚠️ Delivery Account Pending Approval</p>
        <p class="text-xs text-amber-700 mt-1">Your delivery partner profile is awaiting admin approval. You can browse available orders, but you won't be able to accept a delivery until you're approved.</p>
      </div>

      <div v-if="deliveryStore.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Available Nearby" :value="deliveryStore.stats.availableCount" icon="📍" color="sky" />
        <StatCard title="Pending Deliveries" :value="deliveryStore.stats.pendingDeliveries" icon="⏳" color="amber" />
        <StatCard title="Completed" :value="deliveryStore.stats.completedDeliveries" icon="✅" color="emerald" />
        <StatCard title="Total Earnings" :value="`₹${deliveryStore.stats.totalEarnings}`" icon="💰" color="teal" />
      </div>

      <div v-if="deliveryStore.error" class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">
        {{ deliveryStore.error }}
      </div>

      <div v-if="deliveryStore.loading" class="text-gray-400 text-center py-16">Loading available orders...</div>
      <EmptyState
        v-else-if="!deliveryStore.available.length"
        icon="📍"
        title="No Orders Ready for Pickup"
        description="There are currently no unassigned orders ready in your area. Check back soon!"
      />

      <div v-else class="space-y-4">
        <Card v-for="o in deliveryStore.available" :key="o.id">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-bold text-gray-900">{{ o.orderNumber }}</p>
              <p class="text-xs text-gray-400">{{ o.items?.length || 0 }} item(s) · Total: ₹{{ o.total }}</p>
            </div>
            <StatusBadge :status="o.status" />
          </div>
          <p class="text-sm text-gray-600 mb-4 bg-gray-50/60 p-3 rounded-xl">📍 {{ o.address?.line1 }}, {{ o.address?.city }} - {{ o.address?.pincode }}</p>
          <div class="flex justify-end">
            <Button size="sm" :disabled="deliveryStore.stats && !deliveryStore.stats.isApproved" @click="accept(o)">Accept Delivery</Button>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
