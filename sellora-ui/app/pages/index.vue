<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';

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
    <section class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-indigo-950 text-white py-24 md:py-32">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#14b8a615_0%,transparent_70%)]"></div>
      
      <div class="mx-auto max-w-5xl px-6 text-center relative z-10">
        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-teal-300 mb-8 shadow-inner">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
          </span>
          Next-Gen Neighborhood Super App
        </div>

        <h1 class="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          Shop local. Book services.<br>
          <span class="bg-gradient-to-r from-teal-400 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">
            Delivered in minutes.
          </span>
        </h1>
        
        <p class="max-w-2xl mx-auto text-lg text-slate-300 mb-10 leading-relaxed">
          One Verse AI powers Sellora — connecting physical product stores, verified home service providers, and swift delivery partners into one seamless marketplace experience.
        </p>

        <!-- CTA Action buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button to="/shop" as="NuxtLink" size="lg" class="w-full sm:w-auto px-8 bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 font-bold">
            Explore Shop →
          </Button>
          <Button to="/services" as="NuxtLink" size="lg" variant="secondary" class="w-full sm:w-auto px-8 font-bold border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
            Book Services 🧰
          </Button>
        </div>

        <!-- Role Badges -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 border-t border-white/10">
          <NuxtLink to="/shop" class="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left group">
            <div class="text-xl mb-1 group-hover:scale-110 transition-transform">🛒</div>
            <p class="font-bold text-xs text-white">For Customers</p>
            <p class="text-[10px] text-gray-400">Shop & Book easy</p>
          </NuxtLink>
          <NuxtLink to="/auth/partner-register" class="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left group">
            <div class="text-xl mb-1 group-hover:scale-110 transition-transform">🏪</div>
            <p class="font-bold text-xs text-white">For Merchants</p>
            <p class="text-[10px] text-gray-400">Sell products online</p>
          </NuxtLink>
          <NuxtLink to="/auth/partner-register" class="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left group">
            <div class="text-xl mb-1 group-hover:scale-110 transition-transform">🧰</div>
            <p class="font-bold text-xs text-white">For Professionals</p>
            <p class="text-[10px] text-gray-400">Offer local services</p>
          </NuxtLink>
          <NuxtLink to="/auth/partner-register" class="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left group">
            <div class="text-xl mb-1 group-hover:scale-110 transition-transform">🛵</div>
            <p class="font-bold text-xs text-white">For Drivers</p>
            <p class="text-[10px] text-gray-400">Earn on deliveries</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Core Features Grid -->
    <section class="py-20 bg-white">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center max-w-xl mx-auto mb-14">
          <h2 class="text-3xl font-black text-gray-900 tracking-tight">Everything your city offers, in one app</h2>
          <p class="text-gray-500 text-sm mt-2">Connecting neighborhood sellers with local buyers seamlessly.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <Card hover class="p-8 text-center border-gray-100/80 shadow-sm flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-3xl mb-6 shadow-inner">🛒</div>
            <h3 class="font-bold text-xl mb-2 text-gray-900">Local Shop Catalog</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">Groceries, electronics, fashion, and everyday essentials from verified stores near you.</p>
            <Button to="/shop" as="NuxtLink" variant="secondary" size="sm" class="mt-auto">Browse Store</Button>
          </Card>
          
          <Card hover class="p-8 text-center border-gray-100/80 shadow-sm flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mb-6 shadow-inner">🧰</div>
            <h3 class="font-bold text-xl mb-2 text-gray-900">On-Demand Services</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">Certified plumbers, electricians, AC technicians, cleaning, and personal care at your doorstep.</p>
            <Button to="/services" as="NuxtLink" variant="secondary" size="sm" class="mt-auto">Book Service</Button>
          </Card>
          
          <Card hover class="p-8 text-center border-gray-100/80 shadow-sm flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-6 shadow-inner">🛵</div>
            <h3 class="font-bold text-xl mb-2 text-gray-900">Express Delivery</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">Fast, tracked delivery handled by local delivery partners directly to your address.</p>
            <Button to="/auth/partner-register" as="NuxtLink" variant="secondary" size="sm" class="mt-auto">Join as Driver</Button>
          </Card>
        </div>
      </div>
    </section>

    <!-- Partner Banner Section -->
    <section class="py-16 bg-slate-900 text-white border-t border-slate-800">
      <div class="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 class="text-2xl md:text-3xl font-black mb-2">Want to grow your business on Sellora?</h2>
          <p class="text-slate-400 text-sm max-w-xl">Register as a seller, service provider, or delivery partner and connect with thousands of local customers.</p>
        </div>
        <Button to="/auth/partner-register" as="NuxtLink" size="lg" class="bg-teal-500 hover:bg-teal-600 text-white font-bold whitespace-nowrap">
          Become a Partner Now
        </Button>
      </div>
    </section>
  </div>
</template>