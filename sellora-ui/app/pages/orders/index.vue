<script setup lang="ts">
import { onMounted } from 'vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Card from '~/components/ui/Card.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useOrdersStore } from '~/stores/orders';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Orders — Sellora' });

const ordersStore = useOrdersStore();

onMounted(() => ordersStore.fetchMyOrders());
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10">
    <h1 class="text-3xl font-black text-gray-900 mb-8">My orders</h1>

    <div v-if="ordersStore.loading" class="text-center py-16 text-gray-400">Loading orders...</div>
    <EmptyState
      v-else-if="!ordersStore.orders.length"
      icon="📦"
      title="No Orders Placed Yet"
      description="You haven't placed any orders. Start browsing products from local vendors!"
      action-text="Browse Products"
      action-to="/shop"
    />

    <div v-else class="space-y-3">
      <NuxtLink v-for="o in ordersStore.orders" :key="o.id" :to="`/orders/${o.id}`" class="block">
        <Card hover class="flex items-center justify-between gap-4">
          <div>
            <p class="font-bold text-gray-900">{{ o.orderNumber }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ new Date(o.createdAt).toLocaleDateString() }} · {{ o.items?.length || 0 }} item(s)</p>
          </div>
          <div class="text-right flex items-center gap-4">
            <p class="font-bold text-gray-900">₹{{ o.total }}</p>
            <StatusBadge :status="o.status" />
          </div>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
