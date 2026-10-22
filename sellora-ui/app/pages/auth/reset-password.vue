<script setup lang="ts">
definePageMeta({ middleware: 'guest' });

import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from '~/components/ui/Button.vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = computed(() => String(route.query.email || ''));
const token = computed(() => String(route.query.token || ''));

const newPassword = ref('');
const confirmPassword = ref('');

const submitting = ref(false);
const localError = ref('');

const fieldErrors = reactive({
  newPassword: '',
  confirmPassword: '',
});

// Drives the padlock animation: idle -> checking -> 'success' | 'error'
const status = ref<'idle' | 'checking' | 'success' | 'error'>('idle');
const attempt = ref(0); // bumped each submit so the lock/shake replay on repeat failures

const inputClass = (field: keyof typeof fieldErrors) => [
  'w-full h-10 border rounded-md px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2',
  fieldErrors[field]
    ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
    : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'
];

function validate() {
  fieldErrors.newPassword = '';
  fieldErrors.confirmPassword = '';
  localError.value = '';

  if (!newPassword.value) fieldErrors.newPassword = 'New password is required';
  else if (newPassword.value.length < 6) fieldErrors.newPassword = 'Password must be at least 6 characters';

  if (!confirmPassword.value) fieldErrors.confirmPassword = 'Please confirm your password';
  else if (confirmPassword.value !== newPassword.value) fieldErrors.confirmPassword = 'Passwords do not match';

  return !fieldErrors.newPassword && !fieldErrors.confirmPassword;
}

async function handleSubmit() {
  if (!validate()) {
    localError.value = 'Please fix the highlighted fields';
    return;
  }

  if (!email.value || !token.value) {
    localError.value = 'Reset link is invalid or expired.';
    return;
  }

  attempt.value += 1;
  submitting.value = true;
  status.value = 'checking';

  const ok = await authStore.resetPassword({
    email: email.value,
    token: token.value,
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value,
  });

  if (ok) {
    status.value = 'success';
    // hold the unlocked state on screen for 1.5s before navigating away
    setTimeout(() => {
      router.push('/auth/login');
    }, 1500);
    return;
  }

  submitting.value = false;
  localError.value = authStore.error || 'Failed to reset password';
  status.value = 'error';
  // hold the locked/declined state on screen for 1.5s, then clear it
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
          <h1 class="text-xl font-semibold text-gray-900">Set new password</h1>
          <p class="text-sm text-gray-500 mt-1">Enter a new password for your account</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              :disabled="submitting"
              :class="inputClass('newPassword')"
              placeholder="Enter new password"
            />
            <p v-if="fieldErrors.newPassword" class="text-sm text-red-600 mt-1">{{ fieldErrors.newPassword }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Re-enter password</label>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              :disabled="submitting"
              :class="inputClass('confirmPassword')"
              placeholder="Confirm new password"
            />
            <p v-if="fieldErrors.confirmPassword" class="text-sm text-red-600 mt-1">{{ fieldErrors.confirmPassword }}</p>
          </div>

          <div v-if="localError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2" role="alert">
            {{ localError }}
          </div>

          <Button
            type="submit"
            :loading="submitting"
            class="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-md transition-colors duration-150 mt-1"
          >
            Update password
          </Button>

          <p v-if="status === 'checking'" class="text-center text-xs text-gray-400 font-mono tracking-wide">
            updating password<span class="animate-dots"></span>
          </p>
        </form>

        <div class="mt-5 text-center">
          <NuxtLink to="/auth/login" class="text-sm text-teal-700 hover:text-teal-800 font-medium">
            Back to login
          </NuxtLink>
        </div>

        <!-- Padlock overlay: success / error -->
        <transition name="lock-fade">
          <div
            v-if="status === 'success' || status === 'error'"
            class="absolute inset-0 bg-white/92 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2"
          >
            <svg viewBox="0 0 64 70" class="w-14 h-[60px]">
              <!-- shackle: swings open on success, stays shut + jitters on error -->
              <path
                d="M20 30 V22 a12 12 0 0 1 24 0 V30"
                fill="none" stroke-width="4" stroke-linecap="round"
                :class="status === 'success' ? 'stroke-emerald-600 shackle-open' : 'stroke-red-600 shackle-shake'"
              />
              <!-- body -->
              <rect
                x="12" y="30" width="40" height="32" rx="6"
                fill="white" stroke-width="3.5"
                :class="status === 'success' ? 'stroke-emerald-600' : 'stroke-red-600'"
              />
              <!-- keyhole -->
              <circle cx="32" cy="43" r="3.5" :class="status === 'success' ? 'fill-emerald-600' : 'fill-red-600'" />
              <rect x="30.5" y="45" width="3" height="7" rx="1.2" :class="status === 'success' ? 'fill-emerald-600' : 'fill-red-600'" />
            </svg>
            <span
              class="text-xs font-mono uppercase tracking-[0.15em] lock-caption"
              :class="status === 'success' ? 'text-emerald-600' : 'text-red-600'"
            >
              {{ status === 'success' ? 'Password updated' : 'Could not update' }}
            </span>
          </div>
        </transition>
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

.lock-fade-enter-active { transition: opacity 0.15s ease; }
.lock-fade-leave-active { transition: opacity 0.25s ease; }
.lock-fade-enter-from,
.lock-fade-leave-to { opacity: 0; }

/* Shackle swings open on success */
@keyframes shackleOpen {
  0%   { transform: translateX(0) rotate(0deg); }
  60%  { transform: translateX(6px) rotate(18deg); }
  100% { transform: translateX(5px) rotate(15deg); }
}
.shackle-open {
  transform-origin: 44px 30px;
  animation: shackleOpen 0.4s cubic-bezier(.3,.8,.4,1) both;
  animation-delay: 0.15s;
}

/* Shackle rattles but stays locked on error */
@keyframes shackleShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  75% { transform: translateX(-1px); }
}
.shackle-shake {
  animation: shackleShake 0.35s ease-in-out both;
  animation-delay: 0.1s;
}

.lock-caption {
  opacity: 0;
  animation: captionIn 0.25s ease-out both;
  animation-delay: 0.5s;
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
  .card-enter,
  .animate-shake,
  .shackle-open,
  .shackle-shake,
  .lock-caption,
  .animate-dots::after {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>