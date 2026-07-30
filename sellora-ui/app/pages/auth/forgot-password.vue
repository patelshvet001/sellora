<script setup lang="ts">
definePageMeta({ middleware: 'guest' });

import { ref, reactive } from 'vue';
import { useAuthStore } from '~/stores/auth';
import Button from '~/components/ui/Button.vue';

const authStore = useAuthStore();

const email = ref('');
const submitting = ref(false);
const localError = ref('');
const localSuccess = ref('');
const shake = ref(false);
const attempt = ref(0);

const fieldErrors = reactive({
  email: '',
});

function validate() {
  fieldErrors.email = '';
  localError.value = '';

  if (!email.value) {
    fieldErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    fieldErrors.email = 'Enter a valid email address';
  }

  return !fieldErrors.email;
}

async function handleSubmit() {
  localSuccess.value = '';
  if (!validate()) {
    localError.value = 'Please enter a valid email';
    return;
  }

  attempt.value += 1;
  submitting.value = true;
  const ok = await authStore.requestPasswordReset(email.value);
  submitting.value = false;

  if (ok) {
    localSuccess.value = 'Check your email for the reset link.';
  } else {
    localError.value = authStore.error || 'Failed to send reset link';
    shake.value = true;
    setTimeout(() => (shake.value = false), 500);
  }
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
        :class="{ 'animate-shake': shake }"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

        <div class="mb-6">
          <h1 class="text-xl font-semibold text-gray-900">Forgot password</h1>
          <p class="text-sm text-gray-500 mt-1">Enter your email to get a reset link</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              :disabled="submitting"
              :class="[
                'w-full h-10 border rounded-md px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2',
                fieldErrors.email
                  ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
                  : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'
              ]"
              placeholder="you@example.com"
            />
            <p v-if="fieldErrors.email" class="text-sm text-red-600 mt-1">{{ fieldErrors.email }}</p>
          </div>

          <transition name="banner-pop">
            <div
              v-if="localSuccess"
              class="flex items-center gap-2.5 text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-md px-3 py-2"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0 plane-fly" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22 11 13 2 9 22 2Z" />
              </svg>
              <span>{{ localSuccess }}</span>
            </div>
          </transition>

          <div
            v-if="localError"
            class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
            role="alert"
          >
            {{ localError }}
          </div>

          <Button
            type="submit"
            :loading="submitting"
            class="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-md transition-colors duration-150 mt-1"
          >
            Send reset link
          </Button>
        </form>

        <div class="mt-5 text-center">
          <NuxtLink to="/auth/login" class="text-sm text-teal-700 hover:text-teal-800 font-medium">
            Back to login
          </NuxtLink>
        </div>
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

.banner-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.banner-pop-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

/* Paper plane flies in and settles once the banner appears */
@keyframes planeFly {
  0%   { transform: translate(-10px, 4px) rotate(-8deg); opacity: 0; }
  60%  { transform: translate(1px, -1px) rotate(2deg); opacity: 1; }
  100% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
}
.plane-fly {
  animation: planeFly 0.45s ease-out both;
  animation-delay: 0.05s;
}

@media (prefers-reduced-motion: reduce) {
  .card-enter,
  .animate-shake,
  .plane-fly,
  .banner-pop-enter-active {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>