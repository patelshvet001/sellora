<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import StatCard from '~/components/ui/StatCard.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import { useVendorStore } from '~/stores/vendor';
import { useVendorNav } from '~/composables/useVendorNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['VENDOR'] });
useHead({ title: 'Vendor Dashboard — Sellora' });

const vendorStore = useVendorStore();
const { navItems } = useVendorNav();

onMounted(() => vendorStore.fetchStats());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Vendor" :subtitle="vendorStore.stats?.storeName" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-black text-gray-900">Overview</h1>
        <StatusBadge v-if="vendorStore.stats" :status="vendorStore.stats.isApproved ? 'APPROVED' : 'PENDING'" size="md" />
      </div>

      <div v-if="vendorStore.stats && !vendorStore.stats.isApproved" class="mb-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm px-5 py-4">
        <p class="font-bold">⚠️ Store Pending Approval</p>
        <p class="text-xs text-amber-700 mt-1">Your vendor profile is awaiting admin approval before customers can find and purchase your products.</p>
      </div>

      <div v-if="vendorStore.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Products" :value="vendorStore.stats.productCount" icon="📦" color="sky" />
        <StatCard title="Live Products" :value="vendorStore.stats.activeProductCount" icon="✅" color="emerald" />
        <StatCard title="Low Stock Items" :value="vendorStore.stats.lowStockCount" icon="⚠️" color="amber" />
        <StatCard title="Total Orders" :value="vendorStore.stats.totalOrders" icon="📋" color="indigo" />
        <StatCard title="Pending Orders" :value="vendorStore.stats.pendingOrders" icon="⏳" color="amber" />
        <StatCard title="Total Earnings" :value="`₹${vendorStore.stats.totalEarnings}`" icon="💰" color="teal" />
      </div>
      <div v-else class="text-gray-400 py-12 text-center">Loading dashboard...</div>

      <div class="flex gap-4 mt-8">
        <NuxtLink to="/vendor/products" class="text-teal-700 font-semibold text-sm hover:underline">Manage products →</NuxtLink>
        <NuxtLink to="/vendor/orders" class="text-teal-700 font-semibold text-sm hover:underline">View orders →</NuxtLink>
      </div>
    </div>
  </div>
</template>

