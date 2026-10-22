<script setup lang="ts">
/**
 * DashboardSidebar — Collapsible navigation sidebar for the customer dashboard.
 * Teal/emerald theme matching the Sellora design system.
 * Collapses to hamburger on mobile, stays fixed on desktop.
 */
import { ref, computed } from 'vue';

const emit = defineEmits<{
  'update:activeSection': [section: string];
}>();

const props = defineProps<{
  activeSection: string;
}>();

const mobileOpen = ref(false);

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'profile', label: 'My Profile', icon: '👤' },
  { key: 'orders', label: 'Orders', icon: '📦' },
  { key: 'wishlist', label: 'Wishlist', icon: '❤️' },
  { key: 'addresses', label: 'Addresses', icon: '📍' },
  { key: 'security', label: 'Security', icon: '🔒' },
];

function setActive(key: string) {
  emit('update:activeSection', key);
  mobileOpen.value = false;
}

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value;
}

// Desktop sidebar classes
const desktopClasses = [
  'w-64 shrink-0 hidden lg:flex flex-col',
  'bg-white border-r border-gray-100',
  'min-h-[calc(100vh-73px)]', // header height compensation
].join(' ');

// Mobile overlay classes
const mobileOverlayClasses = [
  'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm',
  'lg:hidden transition-opacity duration-300',
  mobileOpen.value ? 'opacity-100' : 'opacity-0 pointer-events-none',
].join(' ');

// Mobile sidebar classes
const mobileSidebarClasses = [
  'fixed top-0 left-0 z-50 h-full w-72',
  'bg-white shadow-2xl',
  'transform transition-transform duration-300 ease-out',
  mobileOpen.value ? 'translate-x-0' : '-translate-x-full',
].join(' ');
</script>

<template>
  <!-- Mobile toggle button -->
  <button
    class="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
    @click="toggleMobile"
    aria-label="Toggle menu"
  >
    <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
    <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>

  <!-- Mobile overlay -->
  <Transition name="fade">
    <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" @click="mobileOpen = false"></div>
  </Transition>

  <!-- Mobile sidebar -->
  <Transition name="slide-left">
    <div v-if="mobileOpen" class="fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl lg:hidden flex flex-col">
      <!-- Mobile header -->
      <div class="px-6 py-6 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <p class="font-bold text-gray-900">Dashboard</p>
            <p class="text-xs text-gray-400">Customer Portal</p>
          </div>
        </div>
      </div>

      <!-- Mobile nav items -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <button
          v-for="item in navItems"
          :key="item.key"
          @click="setActive(item.key)"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="activeSection === item.key
            ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-200 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'"
        >
          <span class="text-lg">{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </nav>

      <!-- Mobile footer -->
      <div class="px-6 py-4 border-t border-gray-100">
        <p class="text-xs text-gray-400">Sellora v1.0</p>
      </div>
    </div>
  </Transition>

  <!-- Desktop sidebar -->
  <aside :class="desktopClasses">
    <!-- Sidebar header -->
    <div class="px-6 py-6 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          S
        </div>
        <div>
          <p class="font-bold text-gray-900">Dashboard</p>
          <p class="text-xs text-gray-400">Customer Portal</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-6 space-y-1">
      <p class="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Menu</p>
      <button
        v-for="item in navItems"
        :key="item.key"
        @click="setActive(item.key)"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group"
        :class="activeSection === item.key
          ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-200 shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'"
      >
        <span class="text-lg group-hover:scale-110 transition-transform duration-200">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <!-- Active indicator dot -->
        <span
          v-if="activeSection === item.key"
          class="ml-auto w-2 h-2 rounded-full bg-teal-500"
        ></span>
      </button>
    </nav>

    <!-- Sidebar footer -->
    <div class="px-6 py-4 border-t border-gray-100">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-xs text-gray-400 hover:text-teal-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Back to Store
      </NuxtLink>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-left-enter-from {
  transform: translateX(-100%);
}
.slide-left-leave-to {
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none !important;
  }
  .slide-left-enter-from,
  .slide-left-leave-to {
    transform: translateX(0);
  }
}
</style>

