<script setup lang="ts">
/**
 * AddressManager — Full CRUD address management component.
 * Allows adding, editing, deleting, and setting default addresses.
 * Matches the natural profile styling.
 */
import { ref, reactive, computed, onMounted } from 'vue';
import { useAddressStore, type Address } from '~/stores/address';
import Button from '~/components/ui/Button.vue';
import StatusOverlay from '~/components/profile/StatusOverlay.vue';

const addressStore = useAddressStore();

const emit = defineEmits<{
  refresh: [];
}>();

// ===================== State =====================
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const submitting = ref(false);
const deleting = ref<number | null>(null);
const status = ref<'idle' | 'checking' | 'success' | 'error'>('idle');
const localError = ref('');

const form = reactive({
  label: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
});

const fieldErrors = reactive({
  label: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
});

const addressLabels: { value: 'HOME' | 'WORK' | 'OTHER'; label: string; icon: string }[] = [
  { value: 'HOME', label: 'Home', icon: '🏠' },
  { value: 'WORK', label: 'Work', icon: '💼' },
  { value: 'OTHER', label: 'Other', icon: '📍' },
];

// ===================== Lifecycle =====================
onMounted(async () => {
  await addressStore.fetchAddresses();
  loading.value = false;
});

// ===================== Computed =====================
const addresses = computed(() => addressStore.addresses);

function labelIcon(label: string): string {
  return addressLabels.find(l => l.value === label)?.icon || '📍';
}

// ===================== Validation =====================
function validateForm(): boolean {
  fieldErrors.line1 = '';
  fieldErrors.city = '';
  fieldErrors.state = '';
  fieldErrors.pincode = '';
  let valid = true;

  if (!form.line1.trim()) {
    fieldErrors.line1 = 'Address line is required';
    valid = false;
  }
  if (!form.city.trim()) {
    fieldErrors.city = 'City is required';
    valid = false;
  }
  if (!form.state.trim()) {
    fieldErrors.state = 'State is required';
    valid = false;
  }
  if (!form.pincode.trim()) {
    fieldErrors.pincode = 'Pincode is required';
    valid = false;
  } else if (!/^\d{4,10}$/.test(form.pincode.trim())) {
    fieldErrors.pincode = 'Enter a valid pincode';
    valid = false;
  }

  return valid;
}

// ===================== Actions =====================
function resetForm() {
  form.label = 'HOME';
  form.line1 = '';
  form.line2 = '';
  form.city = '';
  form.state = '';
  form.pincode = '';
  form.isDefault = false;
  editingId.value = null;
}

function openAddForm() {
  resetForm();
  showForm.value = true;
  localError.value = '';
}

function openEditForm(address: Address) {
  form.label = address.label;
  form.line1 = address.line1;
  form.line2 = address.line2 || '';
  form.city = address.city;
  form.state = address.state;
  form.pincode = address.pincode;
  form.isDefault = address.isDefault;
  editingId.value = address.id;
  showForm.value = true;
  localError.value = '';
}

async function handleSave() {
  localError.value = '';
  if (!validateForm()) {
    localError.value = 'Please fix the highlighted fields';
    return;
  }

  submitting.value = true;
  status.value = 'checking';

  const payload = {
    label: form.label,
    line1: form.line1.trim(),
    line2: form.line2.trim() || undefined,
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim(),
    isDefault: form.isDefault,
  };

  let ok: boolean;
  if (editingId.value) {
    ok = await addressStore.updateAddress(editingId.value, payload);
  } else {
    ok = await addressStore.createAddress(payload);
  }

  if (ok) {
    status.value = 'success';
    setTimeout(() => {
      status.value = 'idle';
      showForm.value = false;
      resetForm();
    }, 1200);
  } else {
    submitting.value = false;
    status.value = 'error';
    localError.value = addressStore.error || 'Failed to save address';
    setTimeout(() => {
      if (status.value === 'error') status.value = 'idle';
    }, 2000);
  }
}

async function handleDelete(id: number) {
  if (!confirm('Delete this address?')) return;
  deleting.value = id;
  const ok = await addressStore.deleteAddress(id);
  deleting.value = null;
  if (!ok) {
    localError.value = addressStore.error || 'Failed to delete address';
  }
}

function handleCancel() {
  showForm.value = false;
  resetForm();
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="animate-pulse bg-gray-100 rounded-xl h-24"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="addresses.length === 0 && !showForm" class="text-center py-12">
      <div class="text-5xl mb-4">📍</div>
      <h3 class="text-base font-semibold text-gray-900">No addresses yet</h3>
      <p class="text-sm text-gray-500 mt-1 mb-6">Add a delivery address to get started</p>
      <Button variant="primary" class="bg-teal-700 hover:bg-teal-800 text-white" @click="openAddForm">
        <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add address
      </Button>
    </div>

    <!-- Error -->
    <div v-if="localError && !showForm" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4">
      {{ localError }}
    </div>

    <!-- Address List -->
    <div v-if="!showForm && addresses.length > 0" class="space-y-3">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-gray-500">{{ addresses.length }} address{{ addresses.length !== 1 ? 'es' : '' }} on file</p>
        <Button variant="ghost" size="sm" class="text-teal-700 hover:text-teal-800 font-medium" @click="openAddForm">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add new
        </Button>
      </div>

      <div
        v-for="address in addresses"
        :key="address.id"
        class="relative bg-white border border-gray-200/80 rounded-xl p-5 transition-all duration-200 hover:border-teal-200 hover:shadow-sm group"
      >
        <!-- perforated ticket edge -->
        <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

        <div class="flex items-start gap-4">
          <!-- Label icon -->
          <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shrink-0">
            {{ labelIcon(address.label) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ address.label }}</span>
              <span v-if="address.isDefault" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Default
              </span>
            </div>
            <p class="text-sm font-medium text-gray-900">{{ address.line1 }}</p>
            <p v-if="address.line2" class="text-sm text-gray-600">{{ address.line2 }}</p>
            <p class="text-sm text-gray-600">{{ address.city }}, {{ address.state }} — {{ address.pincode }}</p>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              class="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Edit"
              @click="openEditForm(address)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete"
              :disabled="deleting === address.id"
              @click="handleDelete(address.id)"
            >
              <svg v-if="deleting !== address.id" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <svg v-else class="w-4 h-4 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Address Form (Add/Edit) -->
    <div v-if="showForm" class="relative bg-white border border-gray-200/80 rounded-xl p-6 overflow-hidden mt-2">
      <!-- perforated ticket edge -->
      <div class="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-teal-100"></div>

      <h3 class="text-base font-semibold text-gray-900 mb-5">
        {{ editingId ? 'Edit address' : 'Add new address' }}
      </h3>

      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Label selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Address label</label>
          <div class="flex gap-2">
            <button
              v-for="opt in addressLabels"
              :key="opt.value"
              type="button"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200"
              :class="form.label === opt.value
                ? 'border-teal-300 bg-teal-50 text-teal-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'"
              @click="form.label = opt.value"
            >
              <span>{{ opt.icon }}</span>
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address line 1</label>
          <input
            v-model="form.line1"
            type="text"
            placeholder="Street address, building, apartment"
            class="w-full h-10 border rounded-lg px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2 bg-white"
            :class="fieldErrors.line1
              ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
              : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'"
          />
          <p v-if="fieldErrors.line1" class="text-sm text-red-600 mt-1">{{ fieldErrors.line1 }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address line 2 <span class="text-gray-400 font-normal">(optional)</span></label>
          <input
            v-model="form.line2"
            type="text"
            placeholder="Landmark, area, etc."
            class="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600 transition-colors duration-150 bg-white"
          />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              v-model="form.city"
              type="text"
              placeholder="City"
              class="w-full h-10 border rounded-lg px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2 bg-white"
              :class="fieldErrors.city
                ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
                : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'"
            />
            <p v-if="fieldErrors.city" class="text-sm text-red-600 mt-1">{{ fieldErrors.city }}</p>
          </div>
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              v-model="form.state"
              type="text"
              placeholder="State"
              class="w-full h-10 border rounded-lg px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2 bg-white"
              :class="fieldErrors.state
                ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
                : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'"
            />
            <p v-if="fieldErrors.state" class="text-sm text-red-600 mt-1">{{ fieldErrors.state }}</p>
          </div>
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              v-model="form.pincode"
              type="text"
              placeholder="Pincode"
              class="w-full h-10 border rounded-lg px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2 bg-white"
              :class="fieldErrors.pincode
                ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
                : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'"
            />
            <p v-if="fieldErrors.pincode" class="text-sm text-red-600 mt-1">{{ fieldErrors.pincode }}</p>
          </div>
        </div>

        <!-- Default checkbox -->
        <label class="flex items-center gap-2.5 cursor-pointer group">
          <div
            class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150"
            :class="form.isDefault
              ? 'bg-teal-600 border-teal-600'
              : 'border-gray-300 group-hover:border-gray-400'"
            @click="form.isDefault = !form.isDefault"
          >
            <svg v-if="form.isDefault" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span class="text-sm text-gray-700">Set as default address</span>
        </label>

        <!-- Error -->
        <div v-if="localError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {{ localError }}
        </div>

        <!-- Buttons -->
        <div class="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            :loading="submitting"
            class="bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-lg transition-colors duration-150"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {{ editingId ? 'Update address' : 'Save address' }}
          </Button>

          <Button type="button" variant="ghost" class="text-sm" @click="handleCancel">
            Cancel
          </Button>
        </div>
      </form>

      <!-- Status overlay -->
      <StatusOverlay
        :status="status"
        :success-text="editingId ? 'Address updated' : 'Address added'"
        error-text="Could not save address"
      />
    </div>
  </div>
</template>

