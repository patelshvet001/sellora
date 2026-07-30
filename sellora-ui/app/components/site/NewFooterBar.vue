<script setup lang="ts">
import { ref } from 'vue';

const year = new Date().getFullYear();
const email = ref('');
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const errorMessage = ref('');

async function submitNewsletter() {
  const v = email.value.trim();
  if (!v) return;
  
  // Simple validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(v)) {
    status.value = 'error';
    errorMessage.value = 'Please enter a valid email address.';
    return;
  }

  status.value = 'loading';
  errorMessage.value = '';
  // Simulate API call
  await new Promise((r) => setTimeout(r, 800));
  status.value = 'success';
  email.value = '';
}
</script>

<template>
  <footer class="bg-gray-900 text-gray-400 border-t border-gray-800">
    <!-- Main Directories -->
    <div class="mx-auto max-w-6xl px-4 pt-16 pb-12">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        <!-- Brand Segment -->
        <div class="md:col-span-4 space-y-4">
          <div class="flex items-center gap-3">
            <div class="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/10">
              S
            </div>
            <div>
              <p class="font-extrabold text-white text-lg tracking-tight">Sellora</p>
              <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider">Shop • Book • Deliver</p>
            </div>
          </div>
          <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
            Sellora bridges the gap between local vendors, on-demand service providers, and eager customers. Discover, order, and get things delivered in minutes.
          </p>
          <!-- Social Badges -->
          <div class="flex items-center gap-3 pt-2">
            <a href="#" class="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 hover:scale-110 active:scale-95 transition-all duration-200" aria-label="Facebook">
              <span class="text-xs">FB</span>
            </a>
            <a href="#" class="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 hover:scale-110 active:scale-95 transition-all duration-200" aria-label="X (formerly Twitter)">
              <span class="text-xs">X</span>
            </a>
            <a href="#" class="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 hover:scale-110 active:scale-95 transition-all duration-200" aria-label="Instagram">
              <span class="text-xs">IG</span>
            </a>
            <a href="#" class="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 hover:scale-110 active:scale-95 transition-all duration-200" aria-label="LinkedIn">
              <span class="text-xs">LN</span>
            </a>
          </div>
        </div>

        <!-- Directory Links -->
        <div class="md:col-span-5 grid grid-cols-2 gap-8">
          <div>
            <p class="text-xs font-bold text-white uppercase tracking-widest mb-4">Shop Catalog</p>
            <ul class="space-y-2.5 text-sm">
              <li>
                <NuxtLink to="/customer" class="hover:text-white transition duration-200 flex items-center gap-1.5">
                  <span class="text-indigo-500 text-[10px]">●</span> Fresh Groceries
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/customer" class="hover:text-white transition duration-200 flex items-center gap-1.5">
                  <span class="text-indigo-500 text-[10px]">●</span> Fast Electronics
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/customer" class="hover:text-white transition duration-200 flex items-center gap-1.5">
                  <span class="text-indigo-500 text-[10px]">●</span> Household Services
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/customer" class="hover:text-white transition duration-200 flex items-center gap-1.5">
                  <span class="text-indigo-500 text-[10px]">●</span> Local Pharmacy
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <p class="text-xs font-bold text-white uppercase tracking-widest mb-4">Partner Hub</p>
            <ul class="space-y-2.5 text-sm">
              <li>
                <NuxtLink to="/auth/partner-register" class="hover:text-white transition duration-200">
                  Register as Merchant
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/auth/partner-register" class="hover:text-white transition duration-200">
                  Become Delivery Driver
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/auth/partner-register" class="hover:text-white transition duration-200">
                  Provide Home Services
                </NuxtLink>
              </li>
              <li>
                <a href="#" class="hover:text-white transition duration-200">Partner Resources</a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Newsletter Sign-Up Column -->
        <div class="md:col-span-3 space-y-4">
          <p class="text-xs font-bold text-white uppercase tracking-widest">Newsletter</p>
          <p class="text-sm leading-relaxed">
            Get early access to flash sales, voucher giveaways, and local merchant highlights.
          </p>

          <div class="space-y-2">
            <div class="flex gap-1.5 bg-gray-800 border border-gray-700/80 rounded-xl p-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200">
              <input
                v-model="email"
                type="email"
                placeholder="Enter your email"
                class="flex-1 min-w-0 bg-transparent px-3 text-sm text-white outline-none placeholder-gray-500"
                aria-label="Email Address for newsletter"
                :disabled="status === 'loading' || status === 'success'"
                @keydown.enter="submitNewsletter"
              />
              <button
                type="button"
                class="h-9 px-4 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60 shrink-0"
                :disabled="status === 'loading' || status === 'success'"
                @click="submitNewsletter"
              >
                <span v-if="status === 'loading'">...</span>
                <span v-else-if="status === 'success'">Joined</span>
                <span v-else>Join</span>
              </button>
            </div>
            
            <p v-if="status === 'success'" class="text-xs text-emerald-500 flex items-center gap-1">
              ✓ Successfully subscribed! Check your inbox.
            </p>
            <p v-if="status === 'error'" class="text-xs text-rose-500 flex items-center gap-1">
              ⚠ {{ errorMessage }}
            </p>
          </div>
        </div>

      </div>

      <!-- Footer Divider -->
      <div class="h-px bg-gray-800 my-10" />

      <!-- Sub-footer Rights & Technical details -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
        <p class="text-gray-500">
          © {{ year }} Sellora Inc. All rights reserved.
        </p>
        <div class="flex items-center gap-4 text-gray-500">
          <a href="#" class="hover:text-white transition duration-150">Privacy Policy</a>
          <span>•</span>
          <a href="#" class="hover:text-white transition duration-150">Terms of Use</a>
          <span>•</span>
          <span class="font-medium text-gray-600 bg-gray-850 border border-gray-800 px-2 py-0.5 rounded">Nuxt 3 + TailwindCSS</span>
        </div>
      </div>
    </div>
  </footer>
</template>
