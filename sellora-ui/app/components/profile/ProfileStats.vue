<script setup lang="ts">
/**
 * ProfileStats — Grid of stat cards for profile dashboard.
 * Accepts an array of stats to display in a responsive grid.
 *
 * Props:
 * - stats: Array of { label, value, icon (emoji or SVG path), color? }
 * - columns: Number of columns (default 3, responsive)
 */
interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

defineProps<{
  stats: StatItem[];
  columns?: number;
}>();
</script>

<template>
  <div
    class="grid gap-4"
    :class="[
      columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
      columns === 4 ? 'grid-cols-2 sm:grid-cols-4' :
      'grid-cols-1 sm:grid-cols-3'
    ]"
  >
    <div
      v-for="(stat, index) in stats"
      :key="index"
      class="relative bg-white border border-gray-200 rounded-lg shadow-sm p-5 overflow-hidden hover:border-teal-200 hover:shadow-md transition-all duration-300 group"
    >
      <!-- perforated ticket edge -->
      <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

      <div class="flex items-center gap-4">
        <!-- Icon -->
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
          :class="stat.color || 'bg-teal-50 text-teal-600'"
        >
          {{ stat.icon }}
        </div>

        <div class="min-w-0">
          <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ stat.value }}</p>
          <p class="text-xs text-gray-500 mt-0.5 truncate">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

