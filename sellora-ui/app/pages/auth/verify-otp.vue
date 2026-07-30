<script setup lang="ts">
definePageMeta({ middleware: 'guest' });

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';
import Button from '~/components/ui/Button.vue';

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (!authStore.pendingEmail) {
    router.replace('/auth/register');
    return;
  }
  nextTick(() => inputs.value[0]?.focus());
});

const digits = ref(['', '', '', '', '', '']);
const inputs = ref<HTMLInputElement[]>([]);
const submitting = ref(false);
const resending = ref(false);
const localError = ref('');
const otpError = ref(false);

// Drives the envelope animation: idle -> checking -> 'success' | 'error'
const status = ref<'idle' | 'checking' | 'success' | 'error'>('idle');
const attempt = ref(0); // bumped each submit so the shake/envelope replay on repeat failures

const cooldown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const cooldownLabel = computed(() => `00:${cooldown.value.toString().padStart(2, '0')}`);

function startCooldown() {
  cooldown.value = 30;
  timer = setInterval(() => {
    cooldown.value -= 1;
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}
onMounted(startCooldown);
onUnmounted(() => timer && clearInterval(timer));

function handleInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value.replace(/\D/g, '').slice(-1);
  digits.value[index] = value;
  if (value && index < 5) {
    inputs.value[index + 1]?.focus();
  }
}

function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus();
  }
}

function handlePaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
  if (!pasted) return;
  event.preventDefault();
  pasted.split('').forEach((char, i) => (digits.value[i] = char));
  inputs.value[Math.min(pasted.length, 5)]?.focus();
}

// Auto-submit the moment all 6 digits are in — no need to hunt for the button
watch(
  digits,
  (val) => {
    if (val.join('').length === 6 && !submitting.value && status.value !== 'checking') {
      handleSubmit();
    }
  },
  { deep: true }
);

async function handleSubmit() {
  localError.value = '';
  otpError.value = false;
  const otp = digits.value.join('');
  if (otp.length !== 6) {
    otpError.value = true;
    localError.value = 'Enter the full 6-digit verification code';
    return;
  }

  attempt.value += 1;
  submitting.value = true;
  status.value = 'checking';

  const ok = await authStore.verifyOtp(otp);

  if (ok) {
    status.value = 'success';
    // hold the verified seal on screen for 1.5s before navigating away
    setTimeout(() => {
      router.push(authStore.dashboardPath());
    }, 1500);
    return;
  }

  submitting.value = false;
  otpError.value = true;
  localError.value = authStore.error || 'Invalid or expired OTP code';
  status.value = 'error';

  // hold the invalid seal on screen for 1.5s, then clear the code for a retry
  setTimeout(() => {
    if (status.value === 'error') status.value = 'idle';
    digits.value = ['', '', '', '', '', ''];
    otpError.value = false;
    inputs.value[0]?.focus();
  }, 1500);
}

async function handleResend() {
  if (cooldown.value > 0 || resending.value) return;
  resending.value = true;
  localError.value = '';
  const ok = await authStore.resendOtp();
  resending.value = false;

  if (ok) {
    startCooldown();
    digits.value = ['', '', '', '', '', ''];
    inputs.value[0]?.focus();
  } else {
    localError.value = authStore.error || 'Failed to resend code';
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
        class="card-enter relative bg-white border border-gray-200 rounded-lg shadow-sm p-7 text-center overflow-hidden"
        :class="{ 'animate-shake': status === 'error' }"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

        <div class="mb-6">
          <h1 class="text-xl font-semibold text-gray-900">Verify your email</h1>
          <p class="text-sm text-gray-500 mt-1">
            Enter the 6-digit code sent to<br />
            <span class="font-medium text-teal-700">{{ authStore.pendingEmail || 'your email' }}</span>
          </p>
        </div>

        <!-- Digit inputs -->
        <div class="flex justify-center gap-2 mb-4" @paste="handlePaste">
          <input
            v-for="(d, i) in digits"
            :key="i"
            :ref="(el) => (inputs[i] = el as HTMLInputElement)"
            v-model="digits[i]"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="1"
            :disabled="submitting"
            class="w-11 h-12 text-center text-lg font-semibold border rounded-md outline-none transition-colors duration-150 focus:ring-2 disabled:opacity-60"
            :class="otpError
              ? 'border-red-400 text-red-600 focus:ring-red-500/15 focus:border-red-500'
              : 'border-gray-300 text-gray-900 focus:ring-teal-600/15 focus:border-teal-600'"
            @input="handleInput(i, $event)"
            @keydown="handleKeydown(i, $event)"
          />
        </div>

        <div v-if="localError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4" role="alert">
          {{ localError }}
        </div>

        <!-- Verify Button -->
        <Button
          type="button"
          :loading="submitting"
          class="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-md transition-colors duration-150"
          @click="handleSubmit"
        >
          Confirm & activate
        </Button>

        <p v-if="status === 'checking'" class="text-xs text-gray-400 font-mono tracking-wide mt-2">
          checking code<span class="animate-dots"></span>
        </p>

        <!-- Resend -->
        <div class="pt-5 mt-5 border-t border-gray-100">
          <button
            type="button"
            :disabled="cooldown > 0 || resending"
            class="text-sm font-medium text-teal-700 hover:text-teal-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            @click="handleResend"
          >
            {{ resending ? 'Sending…' : cooldown > 0 ? `Resend code in ${cooldownLabel}` : 'Resend verification code' }}
          </button>
        </div>

        <!-- Envelope overlay: success / error -->
        <transition name="env-fade">
          <div
            v-if="status === 'success' || status === 'error'"
            class="absolute inset-0 bg-white/92 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2"
          >
            <svg viewBox="0 0 100 76" class="w-24 h-[58px]">
              <!-- envelope body -->
              <rect
                x="6" y="14" width="88" height="56" rx="7"
                fill="white" stroke-width="3"
                :class="status === 'success' ? 'stroke-emerald-600' : 'stroke-red-600'"
              />
              <!-- bottom seam -->
              <path
                d="M9 17 L50 50 L91 17" fill="none" stroke-width="3"
                stroke-linecap="round" stroke-linejoin="round"
                :class="status === 'success' ? 'stroke-emerald-600' : 'stroke-red-600'"
              />
              <!-- flap (opens on success, jiggles on error) -->
              <path
                d="M6 17 L50 46 L94 17 L94 14 A7 7 0 0 0 87 14 L13 14 A7 7 0 0 0 6 14 Z"
                fill="white" stroke-width="3"
                stroke-linejoin="round"
                :class="[status === 'success' ? 'stroke-emerald-600 envelope-flap-open' : 'stroke-red-600 envelope-flap-jiggle']"
              />
              <!-- checkmark / x seal -->
              <g v-if="status === 'success'" class="envelope-seal">
                <circle cx="50" cy="42" r="13" fill="white" stroke-width="3" class="stroke-emerald-600" />
                <path d="M44 42 L48 47 L57 37" fill="none" class="stroke-emerald-600" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </g>
              <g v-else class="envelope-seal">
                <circle cx="50" cy="42" r="13" fill="white" stroke-width="3" class="stroke-red-600" />
                <path d="M45 37 L55 47 M55 37 L45 47" class="stroke-red-600" stroke-width="3" stroke-linecap="round" />
              </g>
            </svg>
            <span
              class="text-xs font-mono uppercase tracking-[0.15em] envelope-caption"
              :class="status === 'success' ? 'text-emerald-600' : 'text-red-600'"
            >
              {{ status === 'success' ? 'Email verified' : 'Invalid code' }}
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

.env-fade-enter-active { transition: opacity 0.15s ease; }
.env-fade-leave-active { transition: opacity 0.25s ease; }
.env-fade-enter-from,
.env-fade-leave-to { opacity: 0; }

/* Flap swings open on success */
@keyframes flapOpen {
  0%   { transform: rotate(0deg); }
  60%  { transform: rotate(-26deg); }
  100% { transform: rotate(-20deg); }
}
.envelope-flap-open {
  transform-origin: 50px 14px;
  animation: flapOpen 0.4s cubic-bezier(.3,.8,.4,1) both;
}

/* Flap tries and fails to open on error */
@keyframes flapJiggle {
  0%, 100% { transform: rotate(0deg); }
  30% { transform: rotate(-6deg); }
  60% { transform: rotate(3deg); }
  80% { transform: rotate(-2deg); }
}
.envelope-flap-jiggle {
  transform-origin: 50px 14px;
  animation: flapJiggle 0.4s ease-in-out both;
}

.envelope-seal {
  opacity: 0;
  transform-origin: 50px 42px;
  animation: sealPop 0.25s ease-out both;
  animation-delay: 0.35s;
}
@keyframes sealPop {
  from { opacity: 0; transform: scale(0.4); }
  60%  { opacity: 1; transform: scale(1.15); }
  to   { opacity: 1; transform: scale(1); }
}

.envelope-caption {
  opacity: 0;
  animation: captionIn 0.25s ease-out both;
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
  .card-enter,
  .animate-shake,
  .envelope-flap-open,
  .envelope-flap-jiggle,
  .envelope-seal,
  .envelope-caption,
  .animate-dots::after {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>