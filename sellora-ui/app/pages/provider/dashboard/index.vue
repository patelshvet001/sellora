<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import StatCard from '~/components/ui/StatCard.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import { useProviderStore } from '~/stores/provider';
import { useProviderNav } from '~/composables/useProviderNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['SERVICE_PROVIDER'] });
useHead({ title: 'Provider Dashboard — Sellora' });

const providerStore = useProviderStore();
const { navItems } = useProviderNav();

onMounted(() => providerStore.fetchStats());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Service Provider" :subtitle="providerStore.stats?.businessName" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-black text-gray-900">Overview</h1>
        <StatusBadge v-if="providerStore.stats" :status="providerStore.stats.isApproved ? 'APPROVED' : 'PENDING'" size="md" />
      </div>

      <div v-if="providerStore.stats && !providerStore.stats.isApproved" class="mb-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm px-5 py-4">
        <p class="font-bold">⚠️ Profile Pending Approval</p>
        <p class="text-xs text-amber-700 mt-1">Your business profile is awaiting admin approval before customers can find and book your services.</p>
      </div>

      <div v-if="providerStore.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Services" :value="providerStore.stats.serviceCount" icon="🧰" color="sky" />
        <StatCard title="Live Services" :value="providerStore.stats.activeServiceCount" icon="✅" color="emerald" />
        <StatCard title="Pending Bookings" :value="providerStore.stats.pendingBookings" icon="⏳" color="amber" />
        <StatCard title="Completed" :value="providerStore.stats.completedBookings" icon="🏁" color="purple" />
        <div class="col-span-2 md:col-span-4">
          <StatCard title="Total Earnings (Completed)" :value="`₹${providerStore.stats.totalEarnings}`" icon="💰" color="teal" />
        </div>
      </div>
      <div v-else class="text-gray-400 py-12 text-center">Loading dashboard...</div>

      <div class="flex gap-4 mt-8">
        <NuxtLink to="/provider/services" class="text-teal-700 font-semibold text-sm hover:underline">Manage services →</NuxtLink>
        <NuxtLink to="/provider/bookings" class="text-teal-700 font-semibold text-sm hover:underline">View bookings →</NuxtLink>
      </div>
    </div>
  </div>
</template>
