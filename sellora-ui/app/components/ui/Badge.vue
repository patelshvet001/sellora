<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { twMerge } from 'tailwind-merge';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md';
}>();

const attrs = useAttrs();
const variant = computed(() => props.variant || 'primary');
const size = computed(() => props.size || 'md');

const className = computed(() => {
  const base = 'inline-flex items-center gap-1.5 rounded-full font-semibold select-none border';
  
  const sizeClass = size.value === 'sm' 
    ? 'px-2 py-0.5 text-[10px] tracking-wide' 
    : 'px-2.5 py-1 text-xs';
    
  let colorClass = '';
  switch (variant.value) {
    case 'secondary':
      colorClass = 'bg-purple-50 text-purple-700 border-purple-100';
      break;
    case 'success':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
      break;
    case 'warning':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-100';
      break;
    case 'danger':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
      break;
    case 'info':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-100';
      break;
    case 'gray':
      colorClass = 'bg-gray-50 text-gray-600 border-gray-150';
      break;
    default: // primary
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-100';
      break;
  }
  
  return twMerge(`${base} ${sizeClass} ${colorClass}`, (attrs.class as string) || '');
});

const restAttrs = computed(() => {
  const { class: _omit, ...rest } = attrs as Record<string, unknown>;
  return rest;
});
</script>

<template>
  <span :class="className" v-bind="restAttrs">
    <slot />
  </span>
</template>
