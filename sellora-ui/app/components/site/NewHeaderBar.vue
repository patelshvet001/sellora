<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';

const authStore = useAuthStore();
const cartStore = useCartStore();

onMounted(() => cartStore.initCart());

const mobileMenuOpen = ref(false);
const userMenuOpen = ref(false);
const cartOpen = ref(false);
const searchQuery = ref('');
const isSearching = ref(false);

const userInitials = computed(() => {
  const name = authStore.user?.name || '';
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] + (parts[1]?.[0] || '')).toUpperCase() || 'U';
});

const avatarUrl = computed(() => {
  // Compute full avatar URL inline for proper Pinia reactivity tracking
  const url = authStore.user?.avatarUrl;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const config = useRuntimeConfig();
  return `${config.public.apiBase.replace('/api', '')}${url}`;
});
const userName = computed(() => authStore.user?.name || authStore.user?.email || '');

const showInitials = ref(false);

function onAvatarError() { showInitials.value = true; }

watch(avatarUrl, (newVal) => {
  showInitials.value = !newVal;
}, { immediate: true });

const toggleUserMenu = () => userMenuOpen.value = !userMenuOpen.value;
const closeAll = () => {
  mobileMenuOpen.value = false;
  userMenuOpen.value = false;
  cartOpen.value = false;
};

function logout() {
  closeAll();
  authStore.logout?.();
}

async function onSearchSubmit() {
  const q = searchQuery.value.trim();
  if (!q) return;
  isSearching.value = true;
  try {
    await navigateTo(`/shop?search=${encodeURIComponent(q)}`);
  } finally {
    isSearching.value = false;
    searchQuery.value = '';
  }
}

function onQuickNav(path: string) {
  closeAll();
  navigateTo(path);
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-lg shadow-sm">
    <div class="mx-auto max-w-7xl px-6 py-4">
      <div class="flex items-center justify-between">
        
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group" @click="closeAll">
          <img 
            src="~/assets/logo.png" 
            alt="Sellora" 
            class="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
          >
        </NuxtLink>

        <!-- Search -->
        <div class="hidden md:flex flex-1 max-w-2xl mx-8">
          <form class="relative w-full" @submit.prevent="onSearchSubmit">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search products, groceries, services..."
              class="w-full h-12 pl-5 pr-12 bg-gray-50 border border-gray-200 rounded-3xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
            >
            <button
              type="submit"
              class="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-2xl hover:bg-teal-50 text-gray-400 hover:text-teal-600 flex items-center justify-center transition-all"
              :disabled="isSearching"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        <!-- Right Side -->
        <div class="flex items-center gap-5">
          <NuxtLink to="/" class="hidden lg:block font-medium text-gray-600 hover:text-teal-700 transition">Home</NuxtLink>
          <NuxtLink to="/shop" class="hidden lg:block font-medium text-gray-600 hover:text-teal-700 transition">Shop</NuxtLink>
          <NuxtLink to="/services" class="hidden lg:block font-medium text-gray-600 hover:text-teal-700 transition">Services</NuxtLink>
          <NuxtLink to="/auth/partner-register" class="hidden lg:block font-semibold text-teal-600 hover:text-teal-700 transition">Become Partner</NuxtLink>

          <!-- Cart -->
          <button
            @click="navigateTo('/cart')"
            class="relative p-3 hover:bg-gray-100 rounded-2xl transition-all"
            aria-label="Cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span v-if="cartStore.cartItemsCount > 0" 
                  class="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-5 min-w-5 flex items-center justify-center rounded-full">
              {{ cartStore.cartItemsCount }}
            </span>
          </button>

          <!-- Auth -->
          <div class="relative">
            <button
              v-if="!authStore.user"
              @click="navigateTo('/auth/login')"
              class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-3xl transition-all active:scale-95 shadow-sm"
            >
              Login
            </button>

            <!-- Logged In User -->
            <div v-else class="flex items-center gap-3 cursor-pointer" @click="toggleUserMenu">
              <div class="h-9 w-9 rounded-2xl bg-teal-100 border border-teal-200 overflow-hidden flex items-center justify-center text-teal-700 font-bold hover:scale-105 transition">
                <img v-if="avatarUrl && !showInitials" :src="avatarUrl" alt="" class="h-full w-full object-cover" @error="onAvatarError">
                <span v-else class="text-sm">{{ userInitials }}</span>
              </div>
              <div class="hidden xl:block">
                <p class="text-sm font-semibold text-gray-900 leading-tight">{{ userName }}</p>
                <p class="text-[10px] uppercase tracking-widest text-teal-600 font-medium">{{ authStore.user?.role }}</p>
              </div>
            </div>

            <!-- User Dropdown -->
            <Transition name="fade">
              <div v-if="userMenuOpen" class="absolute right-0 mt-3 w-60 bg-white rounded-3xl shadow-xl border border-gray-100 py-2 z-50">
                <div class="px-5 py-4 border-b">
                  <p class="text-xs text-gray-500">Signed in as</p>
                  <p class="font-semibold text-gray-800">{{ userName }}</p>
                </div>
                <button @click="onQuickNav(authStore.dashboardPath())" class="w-full text-left px-5 py-3 hover:bg-gray-50 text-sm font-semibold text-teal-700">Dashboard</button>
                <template v-if="authStore.user?.role === 'CUSTOMER'">
                  <button @click="onQuickNav('/dashboard')" class="w-full text-left px-5 py-3 hover:bg-gray-50 text-sm">My Profile</button>
                  <button @click="onQuickNav('/orders')" class="w-full text-left px-5 py-3 hover:bg-gray-50 text-sm">My Orders</button>
                  <button @click="onQuickNav('/bookings')" class="w-full text-left px-5 py-3 hover:bg-gray-50 text-sm">My Bookings</button>
                </template>
                <hr class="my-2">
                <button @click="logout" class="w-full text-left px-5 py-3 text-rose-600 hover:bg-rose-50 text-sm font-medium">Logout</button>
              </div>
            </Transition>
          </div>

          <!-- Mobile Menu Button -->
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden p-3 hover:bg-gray-100 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }
</style>