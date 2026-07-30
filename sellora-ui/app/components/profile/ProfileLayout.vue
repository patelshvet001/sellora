<script setup lang="ts">
/**
 * ProfileLayout — Reusable layout wrapper for profile pages.
 * Matches the auth page design: bg-[#F4F6F5], centered card with perforated ticket edge,
 * wordmark header, and entrance animation.
 *
 * Props:
 * - title: Card title (e.g. "Profile Settings")
 * - subtitle: Card subtitle (e.g. "Manage your account information")
 * - showWordmark: Whether to show the Sellora wordmark (default true)
 * - loading: Show skeleton loading state
 */
defineProps<{
  title?: string;
  subtitle?: string;
  showWordmark?: boolean;
  loading?: boolean;
}>();
</script>

<template>
  <div class="min-h-[80vh] flex items-start justify-center bg-[#F4F6F5] px-4 py-12">
    <div class="w-full max-w-3xl">

      <!-- Wordmark -->
      <div v-if="showWordmark !== false" class="text-center mb-6">
        <span class="text-lg font-semibold text-gray-900">Sellora</span>
        <p class="text-[11px] font-mono tracking-[0.15em] text-gray-400 mt-0.5 uppercase">Buyer &middot; Seller &middot; Partner access</p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="card-enter bg-white border border-gray-200 rounded-lg shadow-sm p-7">
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>
        <div class="animate-pulse space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="space-y-3">
            <div class="h-10 bg-gray-200 rounded w-full"></div>
            <div class="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div class="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>

      <!-- Main card -->
      <div v-else class="card-enter relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100 z-10"></div>

        <!-- Optional header -->
        <div v-if="title || subtitle" class="px-7 pt-7 pb-2">
          <h1 v-if="title" class="text-xl font-semibold text-gray-900">{{ title }}</h1>
          <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
        </div>

        <div class="p-7">
          <slot />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.card-enter {
  animation: cardIn 0.35s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .card-enter {
    animation: none !important;
  }
}
</style>

