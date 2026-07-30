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

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop' },
  { label: 'Services', path: '/services' },
  { label: 'Deals', path: '/deals', badge: true },
];
</script>

<template>
  <header
    class="sticky top-0 z-999 border-b border-black/[0.06] bg-white/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
    <div class="mx-auto max-w-7xl px-6 py-3.5">
      <div class="flex items-center justify-between gap-4">

        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group shrink-0" @click="closeAll">
          <img src="~/assets/logo.png" alt="Sellora"
            class="h-9 w-auto transition-transform duration-300 group-hover:scale-105">
        </NuxtLink>

        <!-- Nav -->
        <nav class="hidden lg:flex items-center gap-1">
          <NuxtLink v-for="link in navLinks" :key="link.path" :to="link.path"
            class="relative px-3.5 py-2 rounded-xl text-[14px] font-medium text-gray-600 hover:text-[#3C3489] hover:bg-[#3C3489]/[0.06] transition-colors duration-200">
            {{ link.label }}
            <span v-if="link.badge"
              class="ml-1.5 align-middle rounded-full bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5">HOT</span>
          </NuxtLink>
          <NuxtLink to="/auth/partner-register"
            class="px-3.5 py-2 rounded-xl text-[14px] font-semibold text-[#3C3489] hover:bg-[#3C3489]/[0.06] transition-colors duration-200">
            Become Partner
          </NuxtLink>
        </nav>

        <!-- Search -->
        <div class="hidden md:flex flex-1 max-w-md">
          <form class="relative w-full" @submit.prevent="onSearchSubmit">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="searchQuery" type="search" placeholder="Search products, groceries, services..."
              class="w-full h-11 pl-10 pr-4 bg-black/[0.03] border border-transparent rounded-2xl text-sm focus:outline-none focus:border-[#3C3489]/40 focus:ring-2 focus:ring-[#3C3489]/15 focus:bg-white transition-all">
          </form>
        </div>

        <!-- Right Side -->
        <div class="flex items-center gap-1.5 shrink-0">

          <!-- Wishlist -->
          <button @click="navigateTo('/wishlist')"
            class="hidden sm:flex p-2.5 hover:bg-black/[0.04] rounded-xl transition-colors" aria-label="Wishlist">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <!-- Cart -->
          <button @click="navigateTo('/cart')" class="relative p-2.5 hover:bg-black/[0.04] rounded-xl transition-colors"
            aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span v-if="cartStore.cartItemsCount > 0"
              class="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full">
              {{ cartStore.cartItemsCount }}
            </span>
          </button>

          <!-- Auth -->
          <div class="relative">
            <button v-if="!authStore.user" @click="navigateTo('/auth/login')"
              class="ml-1.5 px-5 py-2.5 bg-[#3C3489] hover:bg-[#2E2870] text-white text-sm font-semibold rounded-2xl transition-all active:scale-95 shadow-sm">
              Login
            </button>

            <!-- Logged In User -->
            <div v-else class="flex items-center gap-2.5 cursor-pointer pl-2 ml-1" @click="toggleUserMenu">
              <div
                class="h-9 w-9 rounded-xl bg-[#3C3489]/10 border border-[#3C3489]/15 overflow-hidden flex items-center justify-center text-[#3C3489] font-bold transition-transform hover:scale-105">
                <img v-if="avatarUrl && !showInitials" :src="avatarUrl" alt="" class="h-full w-full object-cover"
                  @error="onAvatarError">
                <span v-else class="text-sm">{{ userInitials }}</span>
              </div>
              <div class="hidden xl:block">
                <p class="text-sm font-semibold text-gray-900 leading-tight">{{ userName }}</p>
                <p class="text-[10px] uppercase tracking-widest text-[#3C3489] font-medium">{{ authStore.user?.role }}
                </p>
              </div>
            </div>

            <!-- User Dropdown -->
            <Transition name="fade">
              <div v-if="userMenuOpen"
                class="absolute right-0 mt-3 w-60 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-black/[0.06] pt-2 pb-0 z-50">
                <div class="px-5 py-4 border-b border-black/[0.06]">
                  <p class="text-xs text-gray-500">Signed in as</p>
                  <p class="font-semibold text-gray-800">{{ userName }}</p>
                </div>
                <button @click="onQuickNav(authStore.dashboardPath())"
                  class="w-full text-left px-5 py-3 hover:bg-black/[0.03] text-sm font-semibold text-[#3C3489]">Dashboard</button>
                <template v-if="authStore.user?.role === 'CUSTOMER'">
                  <button @click="onQuickNav('/dashboard')"
                    class="w-full text-left px-5 py-3 hover:bg-black/[0.03] text-sm">My Profile</button>
                  <button @click="onQuickNav('/orders')"
                    class="w-full text-left px-5 py-3 hover:bg-black/[0.03] text-sm">My Orders</button>
                  <button @click="onQuickNav('/bookings')"
                    class="w-full text-left px-5 py-3 hover:bg-black/[0.03] text-sm">My Bookings</button>
                  <button @click="onQuickNav('/wishlist')"
                    class="w-full text-left px-5 py-3 hover:bg-black/[0.03] text-sm">My Wishlist</button>
                </template>
                <hr class="my-0 border-black/[0.06]">
                <button @click="logout"
                  class="w-full text-left px-5 py-3 text-rose-600 hover:bg-rose-50 text-sm font-medium">Logout</button>
              </div>
            </Transition>
          </div>

          <!-- Mobile Menu Button -->
          <button @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden p-2.5 hover:bg-black/[0.04] rounded-xl ml-0.5" aria-label="Menu">
            <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Panel -->
    <Transition name="slide">
      <div v-if="mobileMenuOpen"
        class="lg:hidden border-t border-black/[0.06] bg-white/90 backdrop-blur-xl px-6 py-4 space-y-1">
        <form class="relative mb-3 md:hidden" @submit.prevent="onSearchSubmit">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" type="search" placeholder="Search..."
            class="w-full h-11 pl-10 pr-4 bg-black/[0.03] border border-transparent rounded-2xl text-sm focus:outline-none focus:border-[#3C3489]/40 focus:ring-2 focus:ring-[#3C3489]/15">
        </form>

        <button v-for="link in navLinks" :key="link.path"
          class="w-full flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-[#3C3489]/[0.06]"
          @click="onQuickNav(link.path)">
          {{ link.label }}
          <span v-if="link.badge"
            class="rounded-full bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5">HOT</span>
        </button>
        <button
          class="w-full text-left px-3 py-3 rounded-xl text-[15px] font-semibold text-[#3C3489] hover:bg-[#3C3489]/[0.06]"
          @click="onQuickNav('/auth/partner-register')">
          Become Partner
        </button>
        <button
          class="w-full text-left px-3 py-3 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-[#3C3489]/[0.06]"
          @click="onQuickNav('/wishlist')">
          Wishlist
        </button>

        <div class="pt-2 mt-2 border-t border-black/[0.06]">
          <button v-if="!authStore.user"
            class="w-full px-5 py-3 bg-[#3C3489] text-white text-sm font-semibold rounded-2xl"
            @click="onQuickNav('/auth/login')">
            Login
          </button>
          <button v-else
            class="w-full text-left px-3 py-3 rounded-xl text-[15px] font-medium text-rose-600 hover:bg-rose-50"
            @click="logout">
            Logout
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>