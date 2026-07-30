<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';
import NewHeaderBar from '~/components/site/NewHeaderBar.vue';
import NewFooterBar from '~/components/site/NewFooterBar.vue';

const authStore = useAuthStore();
const cartStore = useCartStore();

onMounted(async () => {
  await authStore.fetchMe();
  cartStore.initCart();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50/30 text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
    <NuxtRouteAnnouncer />
    <NewHeaderBar />
    <main class="flex-grow">
      <NuxtPage />
    </main>
    <NewFooterBar />
  </div>
</template>



