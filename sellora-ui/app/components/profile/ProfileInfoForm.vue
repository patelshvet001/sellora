<script setup lang="ts">
/**
 * ProfileInfoForm — Reusable form component for editing profile fields.
 * Matches auth page input styling with validation and status overlay.
 *
 * Props:
 * - fields: Array of field config objects { key, label, type, placeholder, disabled, required }
 * - modelValue: Object with field values
 * - submitting: Whether form is submitting
 * - status: 'idle' | 'success' | 'error'
 * - errorText: Custom error message
 *
 * Emits:
 * - update:modelValue: Emitted when any field changes
 * - submit: Emitted on form submit
 */
import { reactive } from 'vue';

interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'textarea';
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
}

const props = defineProps<{
  fields: FieldConfig[];
  modelValue: Record<string, string>;
  submitting?: boolean;
  status?: 'idle' | 'checking' | 'success' | 'error';
  errorText?: string;
  validationErrors?: Record<string, string>;
  /** Field keys that have no data in the database — show a "Not set" indicator */
  emptyFields?: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>];
  submit: [];
}>();

function handleFieldChange(key: string, value: string) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function inputClass(fieldKey: string) {
  const hasError = props.validationErrors?.[fieldKey];
  return [
    'w-full h-10 border rounded-md px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2',
    hasError
      ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
      : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600',
    props.modelValue[fieldKey] !== undefined && props.fields.find(f => f.key === fieldKey)?.disabled
      ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
      : 'bg-white'
  ].join(' ');
}
</script>

<template>
  <div class="relative bg-white border border-gray-200 rounded-lg shadow-sm p-7 overflow-hidden"
    :class="{ 'animate-shake': status === 'error' }">
    <!-- perforated ticket edge -->
    <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

    <form @submit.prevent="emit('submit')" class="space-y-5">
      <div v-for="field in fields" :key="field.key">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ field.label }}
          <span v-if="field.required === false && !field.disabled" class="text-gray-400 font-normal">(optional)</span>
          <span v-if="emptyFields?.includes(field.key) && !field.disabled"
            class="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Not set
          </span>
        </label>

        <!-- Textarea -->
        <textarea v-if="field.type === 'textarea'" :value="modelValue[field.key] ?? ''"
          @input="handleFieldChange(field.key, ($event.target as HTMLTextAreaElement).value)"
          :placeholder="field.placeholder || ''" :disabled="field.disabled || submitting" :class="[
            inputClass(field.key).replace('h-10', 'min-h-[80px] py-2.5'),
            'resize-none'
          ]" rows="3"></textarea>

        <!-- Regular input -->
        <input v-else :type="field.type || 'text'" :value="modelValue[field.key] ?? ''"
          @input="handleFieldChange(field.key, ($event.target as HTMLInputElement).value)"
          :placeholder="field.placeholder || ''" :disabled="field.disabled || submitting"
          :class="inputClass(field.key)" />

        <p v-if="field.helpText && !validationErrors?.[field.key]" class="text-xs text-gray-400 mt-1">{{ field.helpText
          }}</p>
        <p v-if="validationErrors?.[field.key]" class="text-sm text-red-600 mt-1">{{ validationErrors[field.key] }}</p>
      </div>

      <!-- Global error -->
      <div v-if="errorText" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
        role="alert">
        {{ errorText }}
      </div>

      <!-- Submit slot -->
      <div v-if="$slots.actions" class="pt-2">
        <slot name="actions" />
      </div>

      <!-- Checking indicator -->
      <p v-if="status === 'checking'" class="text-center text-xs text-gray-400 font-mono tracking-wide">
        saving changes<span class="animate-dots"></span>
      </p>
    </form>

    <!-- Status overlay -->
    <slot name="overlay" />
  </div>
</template>

<style scoped>
@keyframes shake {

  10%,
  90% {
    transform: translateX(-1px);
  }

  20%,
  80% {
    transform: translateX(2px);
  }

  30%,
  50%,
  70% {
    transform: translateX(-4px);
  }

  40%,
  60% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
}

.animate-dots::after {
  content: '';
  animation: dotcycle 1.2s steps(4, end) infinite;
}

@keyframes dotcycle {
  0% {
    content: '';
  }

  25% {
    content: '.';
  }

  50% {
    content: '..';
  }

  75% {
    content: '...';
  }

  100% {
    content: '';
  }
}

@media (prefers-reduced-motion: reduce) {

  .animate-shake,
  .animate-dots::after {
    animation: none !important;
  }
}
</style>
