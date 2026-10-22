<script setup lang="ts">
/**
 * StatusOverlay — Animated success / error overlay with signature-style SVG animation.
 * Matches the exact animation pattern from the register page.
 *
 * Props:
 * - status: 'idle' | 'checking' | 'success' | 'error'
 * - successText: text to show on success (default "Saved")
 * - errorText: text to show on error (default "Could not save")
 */
defineProps<{
  status: 'idle' | 'checking' | 'success' | 'error';
  successText?: string;
  errorText?: string;
}>();
</script>

<template>
  <transition name="sig-fade">
    <div
      v-if="status === 'success' || status === 'error'"
      class="absolute inset-0 bg-white/92 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-20"
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
        {{ status === 'success' ? (successText || 'Saved') : (errorText || 'Could not save') }}
      </span>
    </div>
  </transition>
</template>

<style scoped>
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

@media (prefers-reduced-motion: reduce) {
  .sig-ring,
  .sig-mark,
  .sig-caption {
    animation: none !important;
    stroke-dashoffset: 0 !important;
    opacity: 1 !important;
  }
}
</style>

