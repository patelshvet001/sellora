<script setup lang="ts">
definePageMeta({ middleware: 'guest' });

import { ref, reactive, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';
import Button from '~/components/ui/Button.vue';

const authStore = useAuthStore();
const router = useRouter();

type PartnerRole = 'VENDOR' | 'SERVICE_PROVIDER' | 'DELIVERY_PARTNER';

const roleTabs: { value: PartnerRole; label: string }[] = [
  { value: 'VENDOR', label: 'Store merchant' },
  { value: 'SERVICE_PROVIDER', label: 'Service provider' },
  { value: 'DELIVERY_PARTNER', label: 'Delivery driver' },
];

const activeRole = ref<PartnerRole>('VENDOR');
const activeRoleIndex = computed(() => roleTabs.findIndex((t) => t.value === activeRole.value));
const activeRoleTab = computed(() => roleTabs.find((t) => t.value === activeRole.value) ?? roleTabs[0]!);

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  // vendor-only
  storeName: '',
  category: '',
  gstNumber: '',
  address: '',
  city: '',
  pincode: '',
  // service-provider-only
  businessName: '',
  providerCategory: '',
  providerCity: '',
  providerPincode: '',
  bio: '',
  // delivery-only
  vehicleType: 'bike',
  vehicleNumber: '',
  licenseNumber: '',
  deliveryCity: '',
});

function switchRole(role: PartnerRole) {
  if (activeRole.value === role || submitting.value) return;
  activeRole.value = role;
  clearFieldErrors();
  localError.value = '';
}

const submitting = ref(false);
const localError = ref('');
const fieldErrors = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  storeName: '',
  category: '',
  address: '',
  city: '',
  pincode: '',
  businessName: '',
  providerCategory: '',
  providerCity: '',
  providerPincode: '',
  vehicleNumber: '',
  licenseNumber: '',
  deliveryCity: '',
});

// Drives the badge-print animation: idle -> checking -> 'success' | 'error'
const status = ref<'idle' | 'checking' | 'success' | 'error'>('idle');
const attempt = ref(0); // bumped each submit so the badge/shake replay on repeat failures

const inputClass = (field: keyof typeof fieldErrors) => [
  'w-full h-10 border rounded-md px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2',
  fieldErrors[field]
    ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
    : 'border-gray-300 focus:ring-teal-600/15 focus:border-teal-600'
];

const selectClass = 'w-full h-10 border border-gray-300 rounded-md px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600 bg-white';

function clearFieldErrors() {
  Object.keys(fieldErrors).forEach((field) => {
    fieldErrors[field as keyof typeof fieldErrors] = '';
  });
}

const PINCODE_RE = /^[0-9]{4,8}$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;

function validateForm() {
  clearFieldErrors();

  // --- shared fields, checked for every role ---
  if (!form.name.trim()) {
    fieldErrors.name = 'Full name is required';
  } else if (form.name.trim().length < 2) {
    fieldErrors.name = 'Name is too short';
  }

  if (!form.email.trim()) {
    fieldErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.email = 'Enter a valid email address';
  }

  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
    fieldErrors.phone = 'Enter a valid phone number';
  }

  if (!form.password) {
    fieldErrors.password = 'Password is required';
  } else if (form.password.length < 6) {
    fieldErrors.password = 'Password must be at least 6 characters';
  }

  // --- role-specific fields ---
  if (activeRole.value === 'VENDOR') {
    if (!form.storeName.trim()) fieldErrors.storeName = 'Store name is required';
    else if (form.storeName.trim().length < 2) fieldErrors.storeName = 'Store name is too short';

    if (!form.category.trim()) fieldErrors.category = 'Category is required';
    if (!form.address.trim()) fieldErrors.address = 'Store address is required';
    else if (form.address.trim().length < 3) fieldErrors.address = 'Enter a complete address';

    if (!form.city.trim()) fieldErrors.city = 'City is required';
    if (!form.pincode.trim()) fieldErrors.pincode = 'Pincode is required';
    else if (!PINCODE_RE.test(form.pincode.trim())) fieldErrors.pincode = 'Enter a valid pincode';
  } else if (activeRole.value === 'SERVICE_PROVIDER') {
    if (!form.businessName.trim()) fieldErrors.businessName = 'Business name is required';
    else if (form.businessName.trim().length < 2) fieldErrors.businessName = 'Business name is too short';

    if (!form.providerCategory.trim()) fieldErrors.providerCategory = 'Service category is required';
    if (!form.providerCity.trim()) fieldErrors.providerCity = 'City is required';
    if (!form.providerPincode.trim()) fieldErrors.providerPincode = 'Pincode is required';
    else if (!PINCODE_RE.test(form.providerPincode.trim())) fieldErrors.providerPincode = 'Enter a valid pincode';
  } else {
    if (!form.vehicleNumber.trim()) fieldErrors.vehicleNumber = 'Vehicle number is required';
    else if (form.vehicleNumber.trim().length < 3) fieldErrors.vehicleNumber = 'Enter a valid vehicle number';

    if (!form.licenseNumber.trim()) fieldErrors.licenseNumber = 'License number is required';
    else if (form.licenseNumber.trim().length < 3) fieldErrors.licenseNumber = 'Enter a valid license number';

    if (!form.deliveryCity.trim()) fieldErrors.deliveryCity = 'City is required';
  }

  return Object.values(fieldErrors).every((message) => !message);
}

async function handleSubmit() {
  localError.value = '';

  if (!validateForm()) {
    localError.value = 'Please fix the highlighted fields';
    return;
  }

const payload: Record<string, any> = {
    name: form.name,
    email: form.email,
    password: form.password,
    phone: form.phone.trim() || undefined,
    role: activeRole.value,
  };

  if (activeRole.value === 'VENDOR') {
    Object.assign(payload, {
      storeName: form.storeName,
      category: form.category,
      gstNumber: form.gstNumber || undefined,
      address: form.address,
      city: form.city,
      pincode: form.pincode,
    });
  } else if (activeRole.value === 'SERVICE_PROVIDER') {
    Object.assign(payload, {
      businessName: form.businessName,
      category: form.providerCategory,
      city: form.providerCity,
      pincode: form.providerPincode,
      bio: form.bio.trim() || undefined,
    });
  } else {
    Object.assign(payload, {
      vehicleType: form.vehicleType,
      vehicleNumber: form.vehicleNumber,
      licenseNumber: form.licenseNumber,
      city: form.deliveryCity,
    });
  }

  attempt.value += 1;
  submitting.value = true;
  status.value = 'checking';

  const ok = await authStore.register(payload);

  if (ok) {
    status.value = 'success';
    // hold the issued badge on screen for 1.5s before navigating away
    setTimeout(() => {
      router.push('/auth/verify-otp');
    }, 1500);
    return;
  }

  submitting.value = false;
  localError.value = authStore.error || 'Failed to onboard partner account';
  status.value = 'error';
  // hold the declined badge on screen for 1.5s, then clear it
  setTimeout(() => {
    if (status.value === 'error') status.value = 'idle';
  }, 1500);
}
</script>

<template>
  <div class="min-h-[85vh] flex items-center justify-center bg-[#F4F6F5] px-4 py-16">
    <div class="w-full max-w-md">

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
          <h1 class="text-xl font-semibold text-gray-900">Partner registration</h1>
          <p class="text-sm text-gray-500 mt-1">Onboard as a merchant, service provider, or delivery partner</p>
        </div>

        <!-- Segmented Toggle (3-way: merchant / service provider / delivery) -->
        <div class="relative flex bg-gray-100 rounded-md p-1 mb-6">
          <div
            class="absolute top-1 bottom-1 w-[calc(33.333%-5.33px)] bg-teal-700 rounded-md transition-transform duration-300 ease-out"
            :style="{ transform: `translateX(calc(${activeRoleIndex} * (100% + 4px)))` }"
          />
          <button
            v-for="tab in roleTabs"
            :key="tab.value"
            type="button"
            :disabled="submitting"
            class="relative z-10 flex-1 flex items-center justify-center gap-1 py-2 text-[13px] font-medium rounded-md transition-colors duration-300 disabled:cursor-not-allowed px-1"
            :class="activeRole === tab.value ? 'text-white' : 'text-gray-500 hover:text-gray-900'"
            @click="switchRole(tab.value)"
          >
            <svg v-if="tab.value === 'VENDOR'" viewBox="0 0 16 16" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 6.5 3 2.5h10l1 4" />
              <path d="M2 6.5v7h12v-7" />
              <path d="M2 6.5c0 1.4 1.1 2.5 2.5 2.5S7 7.9 7 6.5c0 1.4 1.1 2.5 2.5 2.5S12 7.9 12 6.5" />
            </svg>
            <svg v-else-if="tab.value === 'SERVICE_PROVIDER'" viewBox="0 0 16 16" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 2 9.2 4.6 12 5 9.9 7 10.4 9.9 8 8.5 5.6 9.9 6.1 7 4 5 6.8 4.6 8 2Z" />
              <path d="M3 13.5c1-1.8 2.9-2.8 5-2.8s4 1 5 2.8" />
            </svg>
            <svg v-else viewBox="0 0 16 16" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="4" cy="12" r="2" />
              <circle cx="13" cy="12" r="2" />
              <path d="M4 12 6.5 6h3L12 9.5H8" />
              <path d="M6.5 6 5.5 4h-1.5" />
            </svg>
            <span class="truncate">{{ tab.label }}</span>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Shared fields -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact name</label>
              <input v-model="form.name" type="text" autocomplete="name" :disabled="submitting" :class="inputClass('name')" placeholder="John Doe" />
              <p v-if="fieldErrors.name" class="text-sm text-red-600 mt-1">{{ fieldErrors.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Business email</label>
              <input v-model="form.email" type="email" autocomplete="email" :disabled="submitting" :class="inputClass('email')" placeholder="business@example.com" />
              <p v-if="fieldErrors.email" class="text-sm text-red-600 mt-1">{{ fieldErrors.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone number <span class="text-gray-400 font-normal">(optional)</span></label>
              <input v-model="form.phone" type="tel" autocomplete="tel" :disabled="submitting" :class="inputClass('phone')" placeholder="+91 9876543210" />
              <p v-if="fieldErrors.phone" class="text-sm text-red-600 mt-1">{{ fieldErrors.phone }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input v-model="form.password" type="password" autocomplete="new-password" :disabled="submitting" :class="inputClass('password')" placeholder="Min. 6 characters" />
              <p v-if="fieldErrors.password" class="text-sm text-red-600 mt-1">{{ fieldErrors.password }}</p>
            </div>
          </div>

          <div class="h-px bg-gray-100 my-1" />

          <!-- Role specific form items -->
          <transition name="role-swap" mode="out-in">
            <div v-if="activeRole === 'VENDOR'" key="vendor" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Store name</label>
                <input v-model="form.storeName" type="text" :disabled="submitting" :class="inputClass('storeName')" placeholder="e.g. Acme Organic Fruits" />
                <p v-if="fieldErrors.storeName" class="text-sm text-red-600 mt-1">{{ fieldErrors.storeName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Business category</label>
                <input v-model="form.category" type="text" :disabled="submitting" :class="inputClass('category')" placeholder="e.g. Groceries, Electronics, Clothing" />
                <p v-if="fieldErrors.category" class="text-sm text-red-600 mt-1">{{ fieldErrors.category }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">GSTIN number <span class="text-gray-400 font-normal">(optional)</span></label>
                <input v-model="form.gstNumber" type="text" :disabled="submitting" class="w-full h-10 border border-gray-300 rounded-md px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600 transition-colors duration-150" placeholder="22AAAAA1111A1Z1" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Store address</label>
                <input v-model="form.address" type="text" :disabled="submitting" :class="inputClass('address')" placeholder="Store street address" />
                <p v-if="fieldErrors.address" class="text-sm text-red-600 mt-1">{{ fieldErrors.address }}</p>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input v-model="form.city" type="text" :disabled="submitting" :class="inputClass('city')" placeholder="City" />
                  <p v-if="fieldErrors.city" class="text-sm text-red-600 mt-1">{{ fieldErrors.city }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input v-model="form.pincode" type="text" :disabled="submitting" :class="inputClass('pincode')" placeholder="380001" />
                  <p v-if="fieldErrors.pincode" class="text-sm text-red-600 mt-1">{{ fieldErrors.pincode }}</p>
                </div>
              </div>
            </div>

            <div v-else-if="activeRole === 'SERVICE_PROVIDER'" key="provider" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Business / brand name</label>
                <input v-model="form.businessName" type="text" :disabled="submitting" :class="inputClass('businessName')" placeholder="e.g. Sparkle Home Cleaning" />
                <p v-if="fieldErrors.businessName" class="text-sm text-red-600 mt-1">{{ fieldErrors.businessName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Service category</label>
                <input v-model="form.providerCategory" type="text" :disabled="submitting" :class="inputClass('providerCategory')" placeholder="e.g. Home cleaning, Salon, Repairs, Tutoring" />
                <p v-if="fieldErrors.providerCategory" class="text-sm text-red-600 mt-1">{{ fieldErrors.providerCategory }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Short bio <span class="text-gray-400 font-normal">(optional)</span></label>
                <textarea v-model="form.bio" rows="2" :disabled="submitting" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600 transition-colors duration-150 resize-none" placeholder="A line or two about your services and experience" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input v-model="form.providerCity" type="text" :disabled="submitting" :class="inputClass('providerCity')" placeholder="City" />
                  <p v-if="fieldErrors.providerCity" class="text-sm text-red-600 mt-1">{{ fieldErrors.providerCity }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input v-model="form.providerPincode" type="text" :disabled="submitting" :class="inputClass('providerPincode')" placeholder="395007" />
                  <p v-if="fieldErrors.providerPincode" class="text-sm text-red-600 mt-1">{{ fieldErrors.providerPincode }}</p>
                </div>
              </div>
            </div>

            <div v-else key="delivery" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Vehicle type</label>
                <select v-model="form.vehicleType" :disabled="submitting" :class="selectClass">
                  <option value="bike">Motorcycle / bike</option>
                  <option value="scooter">Electric scooter</option>
                  <option value="car">Delivery van / car</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Vehicle registration number</label>
                <input v-model="form.vehicleNumber" type="text" :disabled="submitting" :class="inputClass('vehicleNumber')" placeholder="e.g. GJ01AB1234" />
                <p v-if="fieldErrors.vehicleNumber" class="text-sm text-red-600 mt-1">{{ fieldErrors.vehicleNumber }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Driver's license number</label>
                <input v-model="form.licenseNumber" type="text" :disabled="submitting" :class="inputClass('licenseNumber')" placeholder="e.g. DL-142011002345" />
                <p v-if="fieldErrors.licenseNumber" class="text-sm text-red-600 mt-1">{{ fieldErrors.licenseNumber }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Operation city</label>
                <input v-model="form.deliveryCity" type="text" :disabled="submitting" :class="inputClass('deliveryCity')" placeholder="City you deliver in" />
                <p v-if="fieldErrors.deliveryCity" class="text-sm text-red-600 mt-1">{{ fieldErrors.deliveryCity }}</p>
              </div>
            </div>
          </transition>

          <div v-if="localError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2" role="alert">
            {{ localError }}
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            :loading="submitting"
            class="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-md transition-colors duration-150 mt-1"
          >
            {{ submitting ? 'Onboarding…' : `Register as ${activeRoleTab.label.toLowerCase()}` }}
          </Button>

          <p v-if="status === 'checking'" class="text-center text-xs text-gray-400 font-mono tracking-wide">
            preparing partner badge<span class="animate-dots"></span>
          </p>
        </form>

        <!-- Badge-print overlay: success / error -->
        <transition name="badge-fade">
          <div
            v-if="status === 'success' || status === 'error'"
            class="absolute inset-0 bg-white/92 backdrop-blur-[1px] flex flex-col items-center justify-center overflow-hidden"
          >
            <!-- printer slot -->
            <div class="w-24 h-1.5 bg-gray-200 rounded-full mb-3 relative z-10"></div>

            <div class="relative w-24 h-32 -mt-3">
              <svg
                viewBox="0 0 96 128"
                class="w-24 h-32 absolute top-0 left-0"
                :class="status === 'success' ? 'badge-issue' : 'badge-jam'"
              >
                <!-- lanyard hole -->
                <circle cx="48" cy="14" r="4" fill="#E5E7EB" />
                <!-- card body -->
                <rect
                  x="6" y="4" width="84" height="116" rx="10"
                  fill="white"
                  stroke-width="3"
                  :class="status === 'success' ? 'stroke-emerald-600' : 'stroke-red-600'"
                />
                <!-- avatar -->
                <circle cx="48" cy="42" r="16" fill="#F1F5F4" stroke="#D1D5DB" stroke-width="1.5" />
                <path d="M34 62c3-6 8-9 14-9s11 3 14 9" fill="#E5E7EB" />
                <!-- text bars -->
                <rect x="24" y="76" width="48" height="6" rx="3" fill="#E5E7EB" />
                <rect x="32" y="88" width="32" height="5" rx="2.5" fill="#EDEFEE" />
                <!-- seal -->
                <g v-if="status === 'success'" class="badge-seal">
                  <circle cx="72" cy="102" r="14" fill="white" stroke-width="3" class="stroke-emerald-600" />
                  <path d="M65 102 L70 107 L79 96" fill="none" class="stroke-emerald-600" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <g v-else class="badge-seal">
                  <circle cx="72" cy="102" r="14" fill="white" stroke-width="3" class="stroke-red-600" />
                  <path d="M66 96 L78 108 M78 96 L66 108" class="stroke-red-600" stroke-width="3" stroke-linecap="round" />
                </g>
              </svg>
            </div>

            <span
              class="badge-caption text-xs font-mono uppercase tracking-[0.15em] mt-2"
              :class="status === 'success' ? 'text-emerald-600' : 'text-red-600'"
            >
              {{ status === 'success' ? 'Partner badge issued' : 'Application declined' }}
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
          Shopping instead?
          <NuxtLink to="/auth/register" class="text-gray-900 font-medium hover:underline">Create a customer account</NuxtLink>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Card entrance on load */
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

.badge-fade-enter-active { transition: opacity 0.15s ease; }
.badge-fade-leave-active { transition: opacity 0.25s ease; }
.badge-fade-enter-from,
.badge-fade-leave-to { opacity: 0; }

/* Vendor <-> Delivery field swap */
.role-swap-enter-active,
.role-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.role-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.role-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Badge slides down out of the "printer slot" and settles — success */
@keyframes badgeIssue {
  0%   { transform: translateY(-118%); }
  70%  { transform: translateY(4%); }
  85%  { transform: translateY(-2%); }
  100% { transform: translateY(0); }
}
.badge-issue {
  animation: badgeIssue 0.55s cubic-bezier(.25,.8,.3,1) both;
}

/* Badge half-prints, jams, then gets pulled back up — error */
@keyframes badgeJam {
  0%   { transform: translateY(-118%); }
  40%  { transform: translateY(-42%); }
  55%  { transform: translateY(-38%); }
  100% { transform: translateY(-118%); }
}
.badge-jam {
  animation: badgeJam 0.6s cubic-bezier(.4,0,.2,1) both;
}

.badge-seal {
  opacity: 0;
  transform-origin: 72px 102px;
  animation: sealPop 0.25s ease-out both;
}
.badge-issue .badge-seal { animation-delay: 0.5s; }
.badge-jam .badge-seal { animation-delay: 0.32s; }
@keyframes sealPop {
  from { opacity: 0; transform: scale(0.4); }
  60%  { opacity: 1; transform: scale(1.15); }
  to   { opacity: 1; transform: scale(1); }
}

.badge-caption {
  opacity: 0;
  animation: captionIn 0.25s ease-out both;
  animation-delay: 0.65s;
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
  .badge-issue,
  .badge-jam,
  .badge-seal,
  .badge-caption,
  .role-swap-enter-active,
  .role-swap-leave-active,
  .animate-dots::after {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>