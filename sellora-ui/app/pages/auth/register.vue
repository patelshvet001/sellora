<script setup lang="ts">
definePageMeta({ middleware: 'guest' });

import { ref, reactive } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';
import Button from '~/components/ui/Button.vue';

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
});

const submitting = ref(false);
const localError = ref('');
const fieldErrors = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
});

// Drives the signature animation: idle -> checking -> 'success' | 'error'
const status = ref<'idle' | 'checking' | 'success' | 'error'>('idle');
const attempt = ref(0); // bumped each submit so the animation replays on repeat failures

const inputClass = (field: keyof typeof fieldErrors) => [
  'w-full h-10 border rounded-md px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2',
  fieldErrors[field]
    ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
    : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'
];

function validateForm() {
  fieldErrors.name = '';
  fieldErrors.email = '';
  fieldErrors.password = '';

  if (!form.name.trim()) {
    fieldErrors.name = 'Full name is required';
  }
  if (!form.email.trim()) {
    fieldErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.email = 'Enter a valid email address';
  }
  if (!form.password) {
    fieldErrors.password = 'Password is required';
  } else if (form.password.length < 6) {
    fieldErrors.password = 'Password must be at least 6 characters';
  }

  return !fieldErrors.name && !fieldErrors.email && !fieldErrors.password;
}

async function handleSubmit() {
  localError.value = '';

  if (!validateForm()) {
    localError.value = 'Please fix the errors above';
    return;
  }

  attempt.value += 1;
  submitting.value = true;
  status.value = 'checking';

  const payload: Record<string, any> = {
    name: form.name,
    email: form.email,
    password: form.password,
    role: 'CUSTOMER',
  };
  if (form.phone.trim()) {
    payload.phone = form.phone.trim();
  }

  const ok = await authStore.register(payload);

  if (ok) {
    status.value = 'success';
    // hold the success mark on screen for 1.5s before navigating away
    setTimeout(() => {
      router.push('/auth/verify-otp');
    }, 1500);
    return;
  }

  submitting.value = false;
  localError.value = authStore.error || 'Failed to register account';
  status.value = 'error';
  // hold the decline mark on screen for 1.5s, then clear it
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
        class="relative bg-white border border-gray-200 rounded-lg shadow-sm p-7 overflow-hidden"
        :class="{ 'animate-shake': status === 'error' }"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

        <div class="mb-6">
          <h1 class="text-xl font-semibold text-gray-900">Create account</h1>
          <p class="text-sm text-gray-500 mt-1">Join Sellora to shop or schedule services</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Full Name field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              v-model="form.name"
              type="text"
              autocomplete="name"
              :disabled="submitting"
              :class="inputClass('name')"
              placeholder="John Doe"
            />
            <p v-if="fieldErrors.name" class="text-sm text-red-600 mt-1">{{ fieldErrors.name }}</p>
          </div>

          <!-- Email field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              :disabled="submitting"
              :class="inputClass('email')"
              placeholder="you@example.com"
            />
            <p v-if="fieldErrors.email" class="text-sm text-red-600 mt-1">{{ fieldErrors.email }}</p>
          </div>

          <!-- Phone field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone number <span class="text-gray-400 font-normal">(optional)</span></label>
            <input
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              :disabled="submitting"
              class="w-full h-10 border border-gray-300 rounded-md px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600 transition-colors duration-150"
              placeholder="+91 9876543210"
            />
          </div>

          <!-- Password field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              :disabled="submitting"
              :class="inputClass('password')"
              placeholder="Min. 6 characters"
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
            Create account
          </Button>

          <p v-if="status === 'checking'" class="text-center text-xs text-gray-400 font-mono tracking-wide">
            creating your account<span class="animate-dots"></span>
          </p>
        </form>

        <!-- Signature overlay: success / error -->
        <transition name="sig-fade">
          <div
            v-if="status === 'success' || status === 'error'"
            class="absolute inset-0 bg-white/92 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2"
          >
            <svg viewBox="0 0 64 64" class="w-16 h-16" fill="none">
              <circle
                cx="32" cy="32" r="27" pathLength="100"
                :class="status === 'success' ? 'sig-ring sig-ring-ok' : 'sig-ring sig-ring-bad'"
                stroke-width="3"
              />
              <path
                v-if="status === 'success'"
                d="M19 33 L28 42 L46 21"
                pathLength="100"
                class="sig-mark sig-check"
                stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
              />
              <template v-else>
                <path d="M21 21 L43 43" pathLength="100" class="sig-mark sig-x-1" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                <path d="M43 21 L21 43" pathLength="100" class="sig-mark sig-x-2" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
              </template>
            </svg>
            <span
              class="text-xs font-mono uppercase tracking-[0.15em] sig-caption"
              :class="status === 'success' ? 'text-emerald-600' : 'text-red-600'"
            >
              {{ status === 'success' ? 'Account created' : 'Could not sign you up' }}
            </span>
          </div>
        </transition>
      </div>

      <!-- Sub Links -->
      <div class="mt-6 text-center space-y-1.5">
        <p class="text-sm text-gray-500">
          Already have an account?
          <NuxtLink to="/auth/login" class="text-gray-900 font-medium hover:underline">Log in here</NuxtLink>
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
@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

.sig-fade-enter-active { transition: opacity 0.15s ease; }
.sig-fade-leave-active { transition: opacity 0.25s ease; }
.sig-fade-enter-from,
.sig-fade-leave-to { opacity: 0; }

/* Ring draws itself first */
@keyframes drawRing {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
.sig-ring {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: drawRing 0.45s ease-out forwards;
  transform-origin: center;
  transform: rotate(-90deg);
}
.sig-ring-ok { color: #059669; stroke: currentColor; }
.sig-ring-bad { color: #dc2626; stroke: currentColor; }

/* Checkmark signs itself after the ring lands */
@keyframes drawMark {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
.sig-mark {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: drawMark 0.3s ease-out forwards;
}
.sig-check {
  color: #059669;
  animation-delay: 0.4s;
}
.sig-x-1 {
  color: #dc2626;
  animation-delay: 0.35s;
  animation-duration: 0.2s;
}
.sig-x-2 {
  color: #dc2626;
  animation-delay: 0.55s;
  animation-duration: 0.2s;
}

.sig-caption {
  opacity: 0;
  animation: captionIn 0.25s ease-out forwards;
  animation-delay: 0.55s;
}
@keyframes captionIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

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
  .animate-shake,
  .sig-ring,
  .sig-mark,
  .sig-caption,
  .animate-dots::after {
    animation: none !important;
    stroke-dashoffset: 0 !important;
    opacity: 1 !important;
  }
}
</style>