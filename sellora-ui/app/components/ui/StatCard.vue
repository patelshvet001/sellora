<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: string | number;
  icon?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  color?: 'teal' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'purple';
}>();

const colorClasses = computed(() => {
  switch (props.color) {
    case 'indigo':
      return { bg: 'bg-indigo-50/80', text: 'text-indigo-600', border: 'border-indigo-100' };
    case 'amber':
      return { bg: 'bg-amber-50/80', text: 'text-amber-600', border: 'border-amber-100' };
    case 'emerald':
      return { bg: 'bg-emerald-50/80', text: 'text-emerald-600', border: 'border-emerald-100' };
    case 'rose':
      return { bg: 'bg-rose-50/80', text: 'text-rose-600', border: 'border-rose-100' };
    case 'sky':
      return { bg: 'bg-sky-50/80', text: 'text-sky-600', border: 'border-sky-100' };
    case 'purple':
      return { bg: 'bg-purple-50/80', text: 'text-purple-600', border: 'border-purple-100' };
    default:
      return { bg: 'bg-teal-50/80', text: 'text-teal-700', border: 'border-teal-100' };
  }
});
</script>

<template>
  <div class="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ title }}</span>
      <div v-if="icon" class="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform duration-200 group-hover:scale-110" :class="[colorClasses.bg, colorClasses.text]">
        {{ icon }}
      </div>
    </div>
    <div class="mt-3 flex items-baseline justify-between">
      <p class="text-2xl font-black text-gray-900 tracking-tight">{{ value }}</p>
      <span v-if="trend" class="text-xs font-medium" :class="trendType === 'up' ? 'text-emerald-600' : trendType === 'down' ? 'text-rose-600' : 'text-gray-500'">
        {{ trend }}
      </span>
    </div>
  </div>
</template>
