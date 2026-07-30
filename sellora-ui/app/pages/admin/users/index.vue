<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import DataTable from '~/components/ui/DataTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Button from '~/components/ui/Button.vue';
import { useAdminStore } from '~/stores/admin';
import { useAdminNav } from '~/composables/useAdminNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'] });
useHead({ title: 'Users & Customers — Sellora Admin' });

const adminStore = useAdminStore();
const { navItems } = useAdminNav();
const activeRole = ref('');

const columns = [
  { key: 'user', label: 'User & Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'joined', label: 'Joined' },
  { key: 'actions', label: 'Actions', class: 'text-right' },
];

function fetchRoleUsers(role: string) {
  activeRole.value = role;
  adminStore.fetchUsers(role || undefined);
}

onMounted(() => fetchRoleUsers(''));
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Admin" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 class="text-2xl font-black text-gray-900">User Management</h1>
        <div class="flex gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm text-xs font-semibold">
          <button
            class="px-3 py-1.5 rounded-lg transition-colors"
            :class="!activeRole ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-50'"
            @click="fetchRoleUsers('')"
          >
            All
          </button>
          <button
            class="px-3 py-1.5 rounded-lg transition-colors"
            :class="activeRole === 'CUSTOMER' ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-50'"
            @click="fetchRoleUsers('CUSTOMER')"
          >
            Customers
          </button>
          <button
            class="px-3 py-1.5 rounded-lg transition-colors"
            :class="activeRole === 'VENDOR' ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-50'"
            @click="fetchRoleUsers('VENDOR')"
          >
            Vendors
          </button>
          <button
            class="px-3 py-1.5 rounded-lg transition-colors"
            :class="activeRole === 'SERVICE_PROVIDER' ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-50'"
            @click="fetchRoleUsers('SERVICE_PROVIDER')"
          >
            Providers
          </button>
        </div>
      </div>

      <DataTable
        :columns="columns"
        :items="adminStore.users"
        :loading="adminStore.loading"
        @row-click="(item) => navigateTo(`/admin/users/${item.id}`)"
      >
        <template #user="{ item }">
          <div>
            <p class="font-semibold text-gray-900">{{ item.name }}</p>
            <p class="text-xs text-gray-400">{{ item.email }}</p>
          </div>
        </template>

        <template #role="{ value }">
          <span class="text-xs font-bold text-teal-700 uppercase">{{ value }}</span>
        </template>

        <template #status="{ item }">
          <div class="flex items-center gap-1.5">
            <StatusBadge :status="item.isActive ? 'ACTIVE' : 'DEACTIVATED'" />
            <StatusBadge :status="item.isVerified ? 'APPROVED' : 'PENDING'" />
          </div>
        </template>

        <template #joined="{ value }">
          <span class="text-xs text-gray-500">{{ new Date(value).toLocaleDateString() }}</span>
        </template>

        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-3" @click.stop>
            <NuxtLink :to="`/admin/users/${item.id}`" class="text-xs font-semibold text-teal-600 hover:underline">
              View / Edit
            </NuxtLink>
            <button
              class="text-xs font-semibold hover:underline"
              :class="item.isActive ? 'text-rose-600' : 'text-teal-600'"
              @click="adminStore.setUserActive(item.id, !item.isActive)"
            >
              {{ item.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
