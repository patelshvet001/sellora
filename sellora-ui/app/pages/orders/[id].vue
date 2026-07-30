<script setup lang="ts">
import { onMounted, computed } from 'vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Card from '~/components/ui/Card.vue';
import { useOrdersStore } from '~/stores/orders';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const ordersStore = useOrdersStore();

const STEPS = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const stepIndex = computed(() => STEPS.indexOf(ordersStore.current?.status));
const isTerminalBad = computed(() => ['CANCELLED', 'RETURNED'].includes(ordersStore.current?.status));

onMounted(() => ordersStore.fetchOrder(String(route.params.id)));
useHead({ title: 'Order Details — Sellora' });
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-10">
    <NuxtLink to="/orders" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 mb-6 transition-colors">
      ← Back to my orders
    </NuxtLink>

    <div v-if="route.query.placed" class="mb-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm px-5 py-4 flex items-center gap-3 shadow-sm">
      <span class="text-xl">🎉</span>
      <div>
        <p class="font-bold">Order Placed Successfully!</p>
        <p class="text-xs text-emerald-700">Thank you for your order. We'll update you as your items are prepared and shipped.</p>
      </div>
    </div>

    <div v-if="ordersStore.loading || !ordersStore.current" class="text-center py-16 text-gray-400">Loading order details...</div>

    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-black text-gray-900">{{ ordersStore.current.orderNumber }}</h1>
          <p class="text-sm text-gray-400">Placed {{ new Date(ordersStore.current.createdAt).toLocaleString() }}</p>
        </div>
        <StatusBadge :status="ordersStore.current.status" size="md" />
      </div>

      <!-- Progress Tracker -->
      <Card class="mb-6 overflow-hidden" v-if="!isTerminalBad">
        <div class="flex items-center justify-between relative py-2">
          <template v-for="(step, i) in STEPS" :key="step">
            <div class="flex flex-col items-center flex-1 z-10">
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm"
                :class="i <= stepIndex ? 'bg-teal-600 text-white scale-105' : 'bg-gray-100 text-gray-400'"
              >
                {{ i < stepIndex ? '✓' : i + 1 }}
              </div>
              <p class="text-[10px] font-bold mt-2 text-center text-gray-600 uppercase tracking-tight">{{ step.replace(/_/g, ' ') }}</p>
            </div>
            <div v-if="i < STEPS.length - 1" class="h-1 flex-1 -mt-5 transition-all duration-500" :class="i < stepIndex ? 'bg-teal-600' : 'bg-gray-100'" />
          </template>
        </div>
      </Card>

      <Card class="mb-4">
        <h2 class="font-bold text-gray-900 mb-3">Order Items</h2>
        <div class="space-y-2">
          <div v-for="it in ordersStore.current.items" :key="it.id" class="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg overflow-hidden shrink-0">
                <img v-if="it.product?.imageUrl" :src="it.product.imageUrl" class="w-full h-full object-cover" />
                <span v-else>🛍️</span>
              </div>
              <div>
                <p class="font-semibold text-gray-800">{{ it.product?.name }}</p>
                <p class="text-xs text-gray-400">Qty: {{ it.quantity }} × ₹{{ it.unitPrice }}</p>
              </div>
            </div>
            <span class="font-bold text-gray-900">₹{{ it.lineTotal }}</span>
          </div>
        </div>
        <div class="border-t border-gray-100 mt-4 pt-3 flex justify-between font-black text-gray-900 text-lg">
          <span>Total Paid</span><span>₹{{ ordersStore.current.total }}</span>
        </div>
      </Card>

      <Card v-if="ordersStore.current.deliveryPartner" class="mb-4">
        <h2 class="font-bold text-gray-900 mb-2 flex items-center gap-2"><span>🛵</span> Delivery Partner</h2>
        <p class="text-sm text-gray-700 font-semibold">{{ ordersStore.current.deliveryPartner.user?.name }}</p>
        <p class="text-xs text-gray-400">Phone: {{ ordersStore.current.deliveryPartner.user?.phone || 'Not provided' }}</p>
      </Card>

      <Card>
        <h2 class="font-bold text-gray-900 mb-2 flex items-center gap-2"><span>📍</span> Delivery Address</h2>
        <p class="text-sm text-gray-700">{{ ordersStore.current.address?.line1 }}, {{ ordersStore.current.address?.city }}, {{ ordersStore.current.address?.state }} - {{ ordersStore.current.address?.pincode }}</p>
      </Card>
    </template>
  </div>
</template>
