<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import StatCard from '~/components/ui/StatCard.vue';
import { useAdminStore } from '~/stores/admin';
import { useAdminNav } from '~/composables/useAdminNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'] });
useHead({ title: 'Admin Dashboard — Sellora' });

const adminStore = useAdminStore();
const { navItems } = useAdminNav();

onMounted(() => adminStore.fetchStats());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Admin" subtitle="Platform control center" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <h1 class="text-2xl font-black text-gray-900 mb-6">Platform overview</h1>

      <div v-if="adminStore.stats" class="space-y-6">
        <div v-if="adminStore.stats.pendingApprovals > 0" class="rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm px-5 py-4 flex items-center justify-between shadow-sm">
          <div>
            <span class="font-bold">⚠️ Action needed:</span> {{ adminStore.stats.pendingApprovals }} account(s) waiting for approval.
          </div>
          <div class="flex gap-2 text-xs font-bold">
            <NuxtLink to="/admin/vendors" class="px-3 py-1.5 bg-amber-200/60 rounded-lg hover:bg-amber-200">Vendors</NuxtLink>
            <NuxtLink to="/admin/providers" class="px-3 py-1.5 bg-amber-200/60 rounded-lg hover:bg-amber-200">Providers</NuxtLink>
            <NuxtLink to="/admin/delivery-partners" class="px-3 py-1.5 bg-amber-200/60 rounded-lg hover:bg-amber-200">Delivery</NuxtLink>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Customers" :value="adminStore.stats.userCount" icon="👥" color="teal" />
          <StatCard title="Vendors" :value="adminStore.stats.vendorCount" icon="🏪" color="amber" />
          <StatCard title="Providers" :value="adminStore.stats.providerCount" icon="🧰" color="sky" />
          <StatCard title="Delivery" :value="adminStore.stats.deliveryCount" icon="🛵" color="emerald" />
          <StatCard title="Total Orders" :value="adminStore.stats.orderCount" icon="📦" color="indigo" />
          <StatCard title="Total Bookings" :value="adminStore.stats.bookingCount" icon="📅" color="purple" />
          <div class="col-span-2">
            <StatCard title="Gross Merchandise Value (Delivered)" :value="`₹${adminStore.stats.gmv}`" icon="💰" color="emerald" />
          </div>
        </div>
      </div>
      <div v-else class="text-gray-400 py-12 text-center">Loading dashboard...</div>
    </div>
  </div>
</template>
