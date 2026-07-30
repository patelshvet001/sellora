<script setup lang="ts">
/**
 * ProfileSecurity — Account security card with change password section.
 * Provides a "Forgot password?" link that can navigate to /auth/forgot-password
 * with the user's email pre-filled.
 *
 * Props:
 * - email: User's email to pre-fill in the reset link
 */
defineProps<{
  email?: string;
}>();
</script>

<template>
  <div class="relative bg-white border border-gray-200 rounded-lg shadow-sm p-7 overflow-hidden">
    <!-- perforated ticket edge -->
    <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

    <div class="mb-6">
      <h3 class="text-base font-semibold text-gray-900">Account Security</h3>
      <p class="text-sm text-gray-500 mt-1">Manage your password and account safety</p>
    </div>

    <!-- Password card -->
    <div class="bg-gray-50 rounded-lg p-5 border border-gray-100">
      <div class="flex items-start gap-4">
        <!-- Lock icon -->
        <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900">Password</h4>
          <p class="text-xs text-gray-500 mt-0.5">You can reset your password anytime</p>
        </div>

        <NuxtLink
          :to="email ? `/auth/forgot-password?email=${encodeURIComponent(email)}` : '/auth/forgot-password'"
          class="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Reset password
        </NuxtLink>
      </div>
    </div>

    <!-- Security tips -->
    <div class="mt-4 space-y-2">
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <svg class="w-3.5 h-3.5 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Use a strong, unique password
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <svg class="w-3.5 h-3.5 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Never share your credentials with anyone
      </div>
    </div>
  </div>
</template>

