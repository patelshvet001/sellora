<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import DataTable from '~/components/ui/DataTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import { useAdminStore } from '~/stores/admin';
import { useAdminNav } from '~/composables/useAdminNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'] });
useHead({ title: 'All Orders — Sellora Admin' });

const adminStore = useAdminStore();
const { navItems } = useAdminNav();

const columns = [
  { key: 'order', label: 'Order No & Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
];

onMounted(() => adminStore.fetchOrders());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Admin" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <h1 class="text-2xl font-black text-gray-900 mb-6">All Orders</h1>

      <DataTable
        :columns="columns"
        :items="adminStore.orders"
        :loading="adminStore.loading"
        @row-click="(item) => navigateTo(`/orders/${item.id}`)"
      >
        <template #order="{ item }">
          <div>
            <p class="font-semibold text-gray-900">{{ item.orderNumber }}</p>
            <p class="text-xs text-gray-400">{{ new Date(item.createdAt).toLocaleString() }}</p>
          </div>
        </template>

        <template #customer="{ item }">
          <p class="font-medium text-gray-800">{{ item.customer?.name }}</p>
          <p class="text-xs text-gray-400">{{ item.customer?.email }}</p>
        </template>

        <template #items="{ item }">
          <span class="text-sm text-gray-600 font-medium">{{ item.items?.length || 0 }} item(s)</span>
        </template>

        <template #total="{ value }">
          <span class="font-bold text-gray-900">₹{{ value }}</span>
        </template>

        <template #status="{ value }">
          <StatusBadge :status="value" />
        </template>
      </DataTable>
    </div>
  </div>
</template>
