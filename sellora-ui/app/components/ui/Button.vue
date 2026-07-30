<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { twMerge } from 'tailwind-merge';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'white';
  size?: 'sm' | 'md' | 'lg';
  as?: 'button' | 'NuxtLink';
  to?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>();

const attrs = useAttrs();

const variant = computed(() => props.variant || 'primary');
const size = computed(() => props.size || 'md');
const isLink = computed(() => props.as === 'NuxtLink' && props.to);

const className = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none';

  const sizeClass =
    size.value === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size.value === 'lg'
        ? 'px-6 py-3.5 text-base'
        : 'px-5 py-2.5 text-sm';

  let colorClass = '';
  if (variant.value === 'secondary') {
    colorClass = 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 focus:ring-indigo-500';
  } else if (variant.value === 'ghost') {
    colorClass = 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300';
  } else if (variant.value === 'danger') {
    colorClass = 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500';
  } else if (variant.value === 'success') {
    colorClass = 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500';
  } else if (variant.value === 'white') {
    colorClass = 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm border border-transparent focus:ring-white';
  } else {
    // Primary
    colorClass = 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20';
  }

  const disabledClass = (props.disabled || props.loading) ? 'opacity-60 cursor-not-allowed pointer-events-none' : '';

  // twMerge resolves conflicting Tailwind utilities by rule (e.g. bg-teal-700
  // beats bg-indigo-600) instead of relying on unpredictable stylesheet order.
  return twMerge(`${base} ${sizeClass} ${colorClass} ${disabledClass}`, (attrs.class as string) || '');
});

const restAttrs = computed(() => {
  const { class: _omit, ...rest } = attrs as Record<string, unknown>;
  return rest;
});
</script>

<template>
  <NuxtLink v-if="isLink" :to="props.to!" :class="className" v-bind="restAttrs">
    <slot v-if="!props.loading" />
    <span v-else class="flex items-center gap-2">
      <svg class="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading...
    </span>
  </NuxtLink>
  <button v-else :type="props.type || 'button'" :class="className" v-bind="restAttrs" :disabled="props.disabled || props.loading">
    <span v-if="props.loading" class="flex items-center gap-2 mr-1">
      <svg class="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <slot />
  </button>
</template>


