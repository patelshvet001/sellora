<script setup lang="ts">
/**
 * RoleSidebar — shared dashboard nav for Vendor / Service Provider / Delivery / Admin.
 * Mirrors DashboardSidebar's teal/emerald theme and mobile-collapse behavior,
 * but takes its nav items and title as props so each role doesn't duplicate the shell.
 */
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

export interface RoleNavItem {
  to: string;
  label: string;
  icon: string;
}

const props = defineProps<{
  title: string;
  subtitle?: string;
  items: RoleNavItem[];
}>();

const authStore = useAuthStore();
const mobileOpen = ref(false);
</script>

<template>
  <div class="lg:flex">
    <!-- Mobile toggle -->
    <button
      class="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center"
      aria-label="Toggle menu"
      @click="mobileOpen = !mobileOpen"
    >
      <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <!-- Mobile overlay -->
    <div
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
      :class="mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @click="mobileOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="w-72 shrink-0 flex flex-col bg-white border-r border-gray-100 min-h-screen lg:min-h-[calc(100vh-73px)] fixed lg:static top-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:translate-x-0"
      :class="mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'"
    >
      <div class="px-6 py-6 border-b border-gray-100">
        <p class="text-[11px] font-semibold tracking-wide text-teal-600 uppercase">{{ props.title }}</p>
        <p v-if="props.subtitle" class="mt-1 text-sm font-medium text-gray-800 truncate">{{ props.subtitle }}</p>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in props.items"
          :key="item.to"
          :to="item.to"
          class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          active-class="bg-teal-50 text-teal-700"
          exact-active-class="bg-teal-50 text-teal-700"
          :class="'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          @click="mobileOpen = false"
        >
          <span class="text-lg group-hover:scale-110 transition-transform duration-200">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="px-6 py-4 border-t border-gray-100 space-y-2">
        <NuxtLink to="/" class="flex items-center gap-2 text-xs text-gray-400 hover:text-teal-600 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Store
        </NuxtLink>
        <button class="flex items-center gap-2 text-xs text-gray-400 hover:text-rose-600 transition-colors" @click="authStore.logout()">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  </div>
</template>
