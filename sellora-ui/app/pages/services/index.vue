<script setup lang="ts">
/** /services — browse bookable services, open booking modal */
import { ref, onMounted } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';
import { useBookingsStore } from '~/stores/bookings';
import { useAuthStore } from '~/stores/auth';

useHead({ title: 'Book Services — Sellora' });

const authStore = useAuthStore();
const bookingsStore = useBookingsStore();
const services = ref<any[]>([]);
const loading = ref(true);
const activeService = ref<any | null>(null);
const submitting = ref(false);
const submitted = ref(false);

const form = ref({ scheduledAt: '', address: '', city: '', pincode: '', notes: '' });

async function load() {
  loading.value = true;
  const { request } = useApi();
  try {
    const res = await request<{ services: any[] }>('/services');
    services.value = res.services;
  } finally {
    loading.value = false;
  }
}

function openBooking(service: any) {
  if (!authStore.isLoggedIn) {
    return navigateTo({ path: '/auth/login', query: { redirect: '/services' } });
  }
  activeService.value = service;
  submitted.value = false;
  form.value = { scheduledAt: '', address: '', city: '', pincode: '', notes: '' };
}

async function submitBooking() {
  if (!activeService.value) return;
  submitting.value = true;
  const booking = await bookingsStore.createBooking({
    serviceId: activeService.value.id,
    ...form.value,
  });
  submitting.value = false;
  if (booking) submitted.value = true;
}

onMounted(load);
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="text-3xl font-black text-gray-900">Book local services</h1>
    <p class="text-gray-500 mt-1 mb-8">Verified professionals for home & personal care, on your schedule.</p>

    <div v-if="loading" class="text-center py-20 text-gray-400">Loading services...</div>
    <div v-else-if="!services.length" class="text-center py-20 text-gray-500">No services listed yet. Check back soon.</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card v-for="s in services" :key="s.id" hover>
        <div class="aspect-video rounded-xl bg-gray-100 mb-3 flex items-center justify-center overflow-hidden">
          <img v-if="s.imageUrl" :src="s.imageUrl" :alt="s.title" class="w-full h-full object-cover" />
          <span v-else class="text-3xl">🧰</span>
        </div>
        <p class="text-xs text-gray-400">{{ s.provider?.businessName }} · {{ s.provider?.city }}</p>
        <h3 class="font-semibold text-gray-900">{{ s.title }}</h3>
        <p class="text-sm text-gray-500 line-clamp-2 mt-1">{{ s.description }}</p>
        <div class="flex items-center justify-between mt-3">
          <span class="font-bold text-gray-900">₹{{ s.price }} <span class="text-xs font-normal text-gray-400">/ {{ s.durationMins }} min</span></span>
          <Button size="sm" @click="openBooking(s)">Book now</Button>
        </div>
      </Card>
    </div>

    <!-- Booking modal -->
    <div v-if="activeService" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" @click.self="activeService = null">
      <Card class="w-full max-w-md">
        <div v-if="!submitted">
          <h2 class="text-lg font-bold text-gray-900">Book "{{ activeService.title }}"</h2>
          <p class="text-sm text-gray-500 mb-4">₹{{ activeService.price }} · {{ activeService.durationMins }} min</p>
          <form class="space-y-3" @submit.prevent="submitBooking">
            <div>
              <label class="text-xs font-medium text-gray-600">Date & time</label>
              <input v-model="form.scheduledAt" type="datetime-local" required class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Address</label>
              <input v-model="form.address" type="text" required placeholder="House / street" class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-medium text-gray-600">City</label>
                <input v-model="form.city" type="text" required class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600">Pincode</label>
                <input v-model="form.pincode" type="text" required class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Notes (optional)</label>
              <textarea v-model="form.notes" rows="2" class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"></textarea>
            </div>
            <p v-if="bookingsStore.error" class="text-sm text-rose-600">{{ bookingsStore.error }}</p>
            <div class="flex gap-3 pt-1">
              <Button type="button" variant="secondary" class="flex-1" @click="activeService = null">Cancel</Button>
              <Button type="submit" class="flex-1" :loading="submitting">Confirm booking</Button>
            </div>
          </form>
        </div>
        <div v-else class="text-center py-4">
          <div class="text-4xl mb-3">✅</div>
          <h2 class="text-lg font-bold text-gray-900">Booking requested</h2>
          <p class="text-sm text-gray-500 mt-1">{{ activeService.provider?.businessName }} will confirm shortly.</p>
          <Button class="mt-5 w-full" as="NuxtLink" to="/bookings" @click="activeService = null">View my bookings</Button>
        </div>
      </Card>
    </div>
  </div>
</template>
