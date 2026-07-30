<script setup lang="ts">
import Button from '~/components/ui/Button.vue';

defineProps<{
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  actionTo?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <div class="text-center py-16 px-4 bg-white/50 rounded-2xl border border-gray-100/80 my-4">
    <div v-if="icon" class="text-5xl mb-4 animate-bounce duration-1000">{{ icon }}</div>
    <h3 class="text-lg font-bold text-gray-900 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-gray-500 max-w-md mx-auto mb-6">{{ description }}</p>
    <div v-if="actionText">
      <Button v-if="actionTo" :to="actionTo" as="NuxtLink" size="sm">{{ actionText }}</Button>
      <Button v-else size="sm" @click="emit('action')">{{ actionText }}</Button>
    </div>
  </div>
</template>
