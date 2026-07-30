<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import DataTable from '~/components/ui/DataTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import { useAdminStore } from '~/stores/admin';
import { useAdminNav } from '~/composables/useAdminNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'] });
useHead({ title: 'Service Providers — Sellora Admin' });

const adminStore = useAdminStore();
const { navItems } = useAdminNav();

const columns = [
  { key: 'business', label: 'Business & Provider' },
  { key: 'category', label: 'Category' },
  { key: 'city', label: 'City' },
  { key: 'status', label: 'Approval Status' },
  { key: 'actions', label: 'Actions', class: 'text-right' },
];

onMounted(() => adminStore.fetchProviders());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Admin" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <h1 class="text-2xl font-black text-gray-900 mb-6">Service Providers</h1>

      <DataTable
        :columns="columns"
        :items="adminStore.providers"
        :loading="adminStore.loading"
      >
        <template #business="{ item }">
          <div>
            <p class="font-semibold text-gray-900">{{ item.businessName }}</p>
            <p class="text-xs text-gray-400">{{ item.user?.name }} · {{ item.user?.email }}</p>
          </div>
        </template>

        <template #status="{ item }">
          <StatusBadge :status="item.isApproved ? 'APPROVED' : 'PENDING'" />
        </template>

        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-3">
            <NuxtLink :to="`/admin/users/${item.userId}`" class="text-xs font-semibold text-gray-500 hover:underline">
              User Detail
            </NuxtLink>
            <button
              class="text-xs font-semibold hover:underline"
              :class="item.isApproved ? 'text-rose-600' : 'text-teal-600'"
              @click="adminStore.approveProvider(item.id, !item.isApproved)"
            >
              {{ item.isApproved ? 'Revoke Approval' : 'Approve Provider' }}
            </button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
