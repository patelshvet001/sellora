<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';
import PartnerBanner from '~/components/site/PartnerBanner.vue';
import HeroBanner from '~/components/site/HeroBanner.vue';

useHead({
  title: 'Sellora — Super App Marketplace for Products, Services & Delivery',
  meta: [
    {
      name: 'description',
      content: 'Sellora is your all-in-one neighborhood marketplace connecting you with local vendors, certified home services, and express delivery.',
    },
  ],
});

const email = ref('');
const subscribed = ref(false);

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (email.value.trim()) {
    subscribed.value = true;
    email.value = '';
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Hero Section -->
<HeroBanner />

    <!-- Core Features Grid -->
    <section class="py-20 bg-white">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center max-w-xl mx-auto mb-14">
          <h2 class="text-3xl font-black text-gray-900 tracking-tight">Everything your city offers, in one app</h2>
          <p class="text-gray-500 text-sm mt-2">Connecting neighborhood sellers with local buyers seamlessly.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <Card hover class="p-8 text-center border-gray-100/80 shadow-sm flex flex-col items-center">
            <div
              class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-3xl mb-6 shadow-inner">
              🛒</div>
            <h3 class="font-bold text-xl mb-2 text-gray-900">Local Shop Catalog</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">Groceries, electronics, fashion, and everyday
              essentials from verified stores near you.</p>
            <Button to="/shop" as="NuxtLink" variant="secondary" size="sm" class="mt-auto">Browse Store</Button>
          </Card>

          <Card hover class="p-8 text-center border-gray-100/80 shadow-sm flex flex-col items-center">
            <div
              class="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mb-6 shadow-inner">
              🧰</div>
            <h3 class="font-bold text-xl mb-2 text-gray-900">On-Demand Services</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">Certified plumbers, electricians, AC technicians,
              cleaning, and personal care at your doorstep.</p>
            <Button to="/services" as="NuxtLink" variant="secondary" size="sm" class="mt-auto">Book Service</Button>
          </Card>

          <Card hover class="p-8 text-center border-gray-100/80 shadow-sm flex flex-col items-center">
            <div
              class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-6 shadow-inner">
              🛵</div>
            <h3 class="font-bold text-xl mb-2 text-gray-900">Express Delivery</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">Fast, tracked delivery handled by local delivery
              partners directly to your address.</p>
            <Button to="/auth/partner-register" as="NuxtLink" variant="secondary" size="sm" class="mt-auto">Join as
              Driver</Button>
          </Card>
        </div>
      </div>
    </section>

    <!-- Partner Banner Section -->
    <PartnerBanner title="Join Our Marketplace" description="Sell your products and services to thousands of customers."
      button-text="Register Today" button-link="/register" />

  </div>
</template>