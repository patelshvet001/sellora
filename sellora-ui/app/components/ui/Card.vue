<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { twMerge } from 'tailwind-merge';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  hover?: boolean;
  padded?: boolean;
  variant?: 'flat' | 'bordered' | 'glass';
}>();

const attrs = useAttrs();
const padded = computed(() => props.padded !== false); // default to true
const hover = computed(() => !!props.hover);
const variant = computed(() => props.variant || 'bordered');

const className = computed(() => {
  const base = 'rounded-2xl transition-all duration-300';
  const padding = padded.value ? 'p-5' : '';
  const hoverClass = hover.value ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50' : '';
  
  let variantClass = '';
  if (variant.value === 'glass') {
    variantClass = 'bg-white/70 backdrop-blur-md border border-white/20 shadow-md';
  } else if (variant.value === 'flat') {
    variantClass = 'bg-gray-50 border border-transparent shadow-none';
  } else {
    // bordered
    variantClass = 'bg-white border border-gray-100 shadow-sm';
  }

  return twMerge(`${base} ${padding} ${hoverClass} ${variantClass}`, (attrs.class as string) || '');
});

const restAttrs = computed(() => {
  const { class: _omit, ...rest } = attrs as Record<string, unknown>;
  return rest;
});
</script>

<template>
  <div :class="className" v-bind="restAttrs">
    <div v-if="$slots.header" class="mb-4">
      <slot name="header" />
    </div>
    <div>
      <slot />
    </div>
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-gray-50">
      <slot name="footer" />
    </div>
  </div>
</template>
