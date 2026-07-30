<script setup lang="ts">
import { computed } from 'vue';
import Badge from '~/components/ui/Badge.vue';

const props = defineProps<{
  status: string;
  size?: 'sm' | 'md';
}>();

const variant = computed(() => {
  switch (props.status?.toUpperCase()) {
    case 'PENDING':
    case 'REQUESTED':
      return 'warning';
    case 'CONFIRMED':
    case 'ACCEPTED':
    case 'PACKED':
      return 'info';
    case 'OUT_FOR_DELIVERY':
    case 'IN_PROGRESS':
      return 'primary';
    case 'DELIVERED':
    case 'COMPLETED':
    case 'APPROVED':
    case 'ACTIVE':
      return 'success';
    case 'CANCELLED':
    case 'REJECTED':
    case 'DEACTIVATED':
    case 'FAILED':
      return 'danger';
    case 'RETURNED':
    default:
      return 'gray';
  }
});

const label = computed(() => {
  if (!props.status) return '';
  return props.status.replace(/_/g, ' ');
});
</script>

<template>
  <Badge :variant="variant" :size="size || 'sm'">
    {{ label }}
  </Badge>
</template>
