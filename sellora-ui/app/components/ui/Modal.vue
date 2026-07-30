<script setup lang="ts">
import Card from '~/components/ui/Card.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  }>(),
  {
    maxWidth: 'md',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

function close() {
  emit('update:modelValue', false);
  emit('close');
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}[props.maxWidth];
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto"
        @click.self="close"
      >
        <Card class="w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200" :class="maxWidthClass">
          <div class="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h2 v-if="title" class="text-lg font-bold text-gray-900">{{ title }}</h2>
            <slot name="title" />
            <button
              class="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors ml-auto"
              aria-label="Close modal"
              @click="close"
            >
              ✕
            </button>
          </div>
          <div>
            <slot />
          </div>
        </Card>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
