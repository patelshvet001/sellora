<script setup lang="ts">
export interface Column {
  key: string;
  label: string;
  class?: string;
}

defineProps<{
  columns: Column[];
  items: any[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  rowClick: [item: any];
}>();
</script>

<template>
  <div class="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
    <table class="w-full text-left text-sm text-gray-600">
      <thead class="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
        <tr>
          <th v-for="col in columns" :key="col.key" scope="col" class="px-6 py-3.5" :class="col.class">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-6 py-12 text-center text-gray-400">
            <div class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading data...</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="!items.length">
          <td :colspan="columns.length" class="px-6 py-12 text-center text-gray-400">
            No records found.
          </td>
        </tr>
        <tr
          v-for="(item, index) in items"
          :key="item.id || index"
          class="hover:bg-gray-50/80 transition-colors cursor-pointer"
          @click="emit('rowClick', item)"
        >
          <td v-for="col in columns" :key="col.key" class="px-6 py-4" :class="col.class">
            <slot :name="col.key" :item="item" :value="item[col.key]">
              {{ item[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
