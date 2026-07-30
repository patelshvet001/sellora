<script setup lang="ts">
import { onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import Card from '~/components/ui/Card.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useProviderStore } from '~/stores/provider';
import { useProviderNav } from '~/composables/useProviderNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['SERVICE_PROVIDER'] });
useHead({ title: 'Bookings — Sellora Provider' });

const providerStore = useProviderStore();
const { navItems } = useProviderNav();

const ACTIONS: Record<string, { label: string; next: string; variant: string }[]> = {
  REQUESTED: [{ label: 'Accept Booking', next: 'ACCEPTED', variant: 'success' }, { label: 'Reject', next: 'REJECTED', variant: 'danger' }],
  ACCEPTED: [{ label: 'Start Service', next: 'IN_PROGRESS', variant: 'primary' }],
  IN_PROGRESS: [{ label: 'Mark Completed', next: 'COMPLETED', variant: 'success' }],
};

async function act(booking: any, next: string) {
  await providerStore.updateBookingStatus(booking.id, next);
}

onMounted(() => providerStore.fetchBookings());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Service Provider" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <h1 class="text-2xl font-black text-gray-900 mb-6">Bookings</h1>

      <div v-if="providerStore.loading" class="text-gray-400 text-center py-16">Loading bookings...</div>
      <EmptyState
        v-else-if="!providerStore.bookings.length"
        icon="📅"
        title="No Bookings Yet"
        description="Bookings submitted by customers will appear here."
      />

      <div v-else class="space-y-4">
        <Card v-for="b in providerStore.bookings" :key="b.id">
          <div class="flex items-start justify-between mb-3 border-b border-gray-50 pb-2">
            <div>
              <p class="font-bold text-gray-900">{{ b.service?.title }}</p>
              <p class="text-xs text-gray-400">Customer: {{ b.customer?.name }} · {{ b.customer?.phone || 'No phone' }}</p>
              <p class="text-xs text-teal-700 font-semibold mt-0.5">Scheduled: {{ new Date(b.scheduledAt).toLocaleString() }}</p>
            </div>
            <StatusBadge :status="b.status" />
          </div>
          <p class="text-sm text-gray-600 mb-4 bg-gray-50/60 p-3 rounded-xl">📍 Address: {{ b.address }}, {{ b.city }} - {{ b.pincode }}</p>
          <div class="flex justify-end gap-3 border-t border-gray-50 pt-2">
            <button
              v-for="a in ACTIONS[b.status] || []"
              :key="a.next"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              :class="a.variant === 'danger' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'"
              @click="act(b, a.next)"
            >
              {{ a.label }}
            </button>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
