<script setup lang="ts">
import { onMounted } from 'vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Card from '~/components/ui/Card.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useBookingsStore } from '~/stores/bookings';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Bookings — Sellora' });

const bookingsStore = useBookingsStore();

onMounted(() => bookingsStore.fetchMyBookings());
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10">
    <h1 class="text-3xl font-black text-gray-900 mb-8">My bookings</h1>

    <div v-if="bookingsStore.loading" class="text-center py-16 text-gray-400">Loading bookings...</div>
    <EmptyState
      v-else-if="!bookingsStore.bookings.length"
      icon="📅"
      title="No Bookings Yet"
      description="You haven't booked any home or personal services yet."
      action-text="Browse Services"
      action-to="/services"
    />

    <div v-else class="space-y-3">
      <Card v-for="b in bookingsStore.bookings" :key="b.id" class="flex items-center justify-between gap-4">
        <div>
          <p class="font-bold text-gray-900">{{ b.service?.title }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ b.bookingNo }} · Scheduled: {{ new Date(b.scheduledAt).toLocaleString() }}</p>
        </div>
        <div class="text-right flex items-center gap-4">
          <p class="font-bold text-gray-900">₹{{ b.price }}</p>
          <StatusBadge :status="b.status" />
        </div>
      </Card>
    </div>
  </div>
</template>
