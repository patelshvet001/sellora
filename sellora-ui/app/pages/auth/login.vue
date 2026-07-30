<script setup lang="ts">
definePageMeta({ middleware: 'guest' });

import { ref, reactive } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';
import Button from '~/components/ui/Button.vue';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const submitting = ref(false);
const localError = ref('');
const fieldErrors = reactive({
  email: '',
  password: '',
});

// Drives the stamp animation: idle -> checking -> 'success' | 'error'
const status = ref<'idle' | 'checking' | 'success' | 'error'>('idle');
const attempt = ref(0); // bumped each submit so the stamp/shake replay on repeat failures

const inputClass = (field: keyof typeof fieldErrors) => [
  'w-full h-10 border rounded-md px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2',
  fieldErrors[field]
    ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
    : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'
];

function validateForm() {
  fieldErrors.email = '';
  fieldErrors.password = '';

  if (!email.value) {
    fieldErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    fieldErrors.email = 'Enter a valid email address';
  }

  if (!password.value) {
    fieldErrors.password = 'Password is required';
  }

  return !fieldErrors.email && !fieldErrors.password;
}

async function handleSubmit() {
  localError.value = '';
  if (!validateForm()) {
    localError.value = 'Please enter valid credentials';
    return;
  }

  attempt.value += 1;
  submitting.value = true;
  status.value = 'checking';

  const ok = await authStore.login(email.value, password.value);

  if (ok) {
    status.value = 'success';
    // hold the verified stamp on screen for 1.5s before navigating away
    setTimeout(() => {
      router.push(authStore.dashboardPath());
    }, 1500);
    return;
  }

  submitting.value = false;

  if (authStore.error === 'Account not verified') {
    router.push('/auth/verify-otp');
    return;
  }

  localError.value = authStore.error || 'Invalid email or password';
  status.value = 'error';
  // hold the declined stamp on screen for 1.5s, then clear it
  setTimeout(() => {
    if (status.value === 'error') status.value = 'idle';
  }, 1500);
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center bg-[#F4F6F5] px-4 py-16">
    <div class="w-full max-w-sm">

      <!-- Wordmark -->
      <div class="text-center mb-6">
        <span class="text-lg font-semibold text-gray-900">Sellora</span>
        <p class="text-[11px] font-mono tracking-[0.15em] text-gray-400 mt-0.5 uppercase">Buyer &middot; Seller &middot; Partner access</p>
      </div>

      <div
        :key="attempt"
        class="card-enter relative bg-white border border-gray-200 rounded-lg shadow-sm p-7 overflow-hidden"
        :class="{ 'animate-shake': status === 'error' }"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

        <div class="mb-6">
          <h1 class="text-xl font-semibold text-gray-900">Log in</h1>
          <p class="text-sm text-gray-500 mt-1">Welcome back to your account</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Email field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              :disabled="submitting"
              :class="inputClass('email')"
              placeholder="you@example.com"
            />
            <p v-if="fieldErrors.email" class="text-sm text-red-600 mt-1">{{ fieldErrors.email }}</p>
          </div>

          <!-- Password field -->
          <div>
            <div class="flex justify-between items-baseline mb-1">
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <NuxtLink to="/auth/forgot-password" class="text-sm text-teal-700 hover:text-teal-800">Forgot password?</NuxtLink>
            </div>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              :disabled="submitting"
              :class="inputClass('password')"
              placeholder="Enter password"
            />
            <p v-if="fieldErrors.password" class="text-sm text-red-600 mt-1">{{ fieldErrors.password }}</p>
          </div>

          <div v-if="localError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2" role="alert">
            {{ localError }}
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            :loading="submitting"
            class="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-md transition-colors duration-150 mt-1"
          >
            Log in
          </Button>

          <p v-if="status === 'checking'" class="text-center text-xs text-gray-400 font-mono tracking-wide">
            verifying credentials<span class="animate-dots"></span>
          </p>
        </form>

        <!-- Stamp overlay: success / error -->
        <transition name="stamp-fade">
          <div
            v-if="status === 'success' || status === 'error'"
            class="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center"
          >
            <div
              class="stamp-pop select-none rounded-md border-4 px-6 py-2.5 uppercase tracking-[0.2em] font-mono text-sm font-bold"
              :class="status === 'success'
                ? 'border-emerald-600 text-emerald-600 -rotate-6'
                : 'border-red-600 text-red-600 rotate-3'"
            >
              {{ status === 'success' ? 'Verified' : 'Declined' }}
            </div>
          </div>
        </transition>
      </div>

      <!-- Sub Links -->
      <div class="mt-6 text-center space-y-1.5">
        <p class="text-sm text-gray-500">
          New here?
          <NuxtLink to="/auth/register" class="text-gray-900 font-medium hover:underline">Create an account</NuxtLink>
        </p>
        <p class="text-sm text-gray-500">
          Want to sell or deliver instead?
          <NuxtLink to="/auth/partner-register" class="text-gray-900 font-medium hover:underline">Become a partner</NuxtLink>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.card-enter {
  animation: cardIn 0.35s ease-out both;
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes stampPop {
  0% { transform: scale(1.8) rotate(0deg); opacity: 0; }
  60% { transform: scale(0.92); opacity: 1; }
  100% { opacity: 1; }
}
.stamp-pop {
  animation: stampPop 0.35s cubic-bezier(.2,.9,.3,1.3) both;
}

.stamp-fade-enter-active { transition: opacity 0.15s ease; }
.stamp-fade-leave-active { transition: opacity 0.25s ease; }
.stamp-fade-enter-from,
.stamp-fade-leave-to { opacity: 0; }

.animate-dots::after {
  content: '';
  animation: dotcycle 1.2s steps(4, end) infinite;
}
@keyframes dotcycle {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
  100% { content: ''; }
}

@media (prefers-reduced-motion: reduce) {
  .card-enter,
  .animate-shake,
  .stamp-pop,
  .animate-dots::after {
    animation: none !important;
  }
}
</style>