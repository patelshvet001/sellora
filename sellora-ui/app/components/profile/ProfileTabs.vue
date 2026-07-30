<script setup lang="ts">
/**
 * ProfileTabs — Tab navigation for profile pages.
 * Natural, minimal design with subtle active indicator.
 */
defineProps<{
  tabs: { key: string; label: string; icon: string }[];
  activeTab: string;
}>();

const emit = defineEmits<{
  'update:activeTab': [key: string];
}>();
</script>

<template>
  <div class="flex border-b border-gray-200/80 mb-8 gap-1">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-t-lg -mb-px"
      :class="activeTab === tab.key
        ? 'text-teal-700 bg-white border border-b-white border-gray-200/80 rounded-b-none shadow-sm'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 border-transparent'"
      @click="emit('update:activeTab', tab.key)"
    >
      <span class="text-lg leading-none">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>

      <!-- Active underline indicator -->
      <span
        v-if="activeTab === tab.key"
        class="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-600 rounded-full"
      ></span>
    </button>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  button {
    transition: none !important;
  }
}
</style>

