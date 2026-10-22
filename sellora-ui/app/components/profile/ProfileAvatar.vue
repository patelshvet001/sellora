<script setup lang="ts">
/**
 * ProfileAvatar — Avatar display with click-to-upload functionality.
 * Shows the user's avatar or initials fallback. Clicking opens file picker.
 *
 * Props:
 * - src: Avatar URL (string or null)
 * - initials: Two-letter initials fallback
 * - name: User's full name (shown below avatar)
 * - email: User's email (shown below name)
 * - role: User role badge (e.g. "Customer", "Vendor")
 * - createdAt: Join date string
 * - uploading: Whether an upload is in progress
 *
 * Emits:
 * - upload: emitted with the selected File object
 */
defineProps<{
  src?: string | null;
  initials: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  uploading?: boolean;
}>();

const emit = defineEmits<{
  upload: [file: File];
}>();

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('upload', file);
    // Reset input so same file can be re-selected
    target.value = '';
  }
}

function triggerFileUpload() {
  document.getElementById('avatar-upload-input')?.click();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
</script>

<template>
  <div class="flex flex-col items-center text-center">
    <!-- Avatar with upload overlay -->
      <div
        class="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center cursor-pointer ring-2 ring-offset-2 ring-teal-200 transition-all duration-200 group-hover:ring-teal-400"
        @click="triggerFileUpload"
      >
        <img
          v-if="src"
          :src="src"
          :alt="name || 'Avatar'"
          class="w-full h-full object-cover"
        />
        <span v-else class="text-2xl font-bold text-white select-none">{{ initials }}</span>

        <!-- Upload overlay on hover -->
        <div
          class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <svg v-if="!uploading" class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <svg v-else class="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>

    <!-- Hidden file input -->
      <input
        id="avatar-upload-input"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />

    <!-- User info -->
    <h2 class="text-lg font-semibold text-gray-900">{{ name || 'User' }}</h2>
    <p class="text-sm text-gray-500 mt-0.5">{{ email }}</p>

    <!-- Role badge -->
    <span
      v-if="role"
      class="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
    >
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
      </svg>
      {{ role }}
    </span>

    <!-- Join date -->
    <p v-if="createdAt" class="text-xs text-gray-400 mt-2">
      Member since {{ formatDate(createdAt) }}
    </p>
  </div>
</template>

