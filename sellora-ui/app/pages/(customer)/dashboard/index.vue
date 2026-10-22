<script setup lang="ts">
/**
 * Customer Dashboard — Premium sidebar-based dashboard for Sellora customers.
 * Replaces the old profile page with a full-featured dashboard including:
 * - Overview (stats + quick actions)
 * - My Profile (personal info, avatar, security)
 * - Orders (order history)
 * - Wishlist (saved items)
 * - Addresses (CRUD address manager)
 * - Security (password reset)
 *
 * Same teal/emerald theme as the rest of the app.
 */
definePageMeta({ middleware: 'auth' });

import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore, type AuthUser } from '~/stores/auth';
import DashboardSidebar from '~/components/dashboard/DashboardSidebar.vue';
import DashboardOverview from '~/components/dashboard/DashboardOverview.vue';
import DashboardOrders from '~/components/dashboard/DashboardOrders.vue';
import DashboardWishlist from '~/components/dashboard/DashboardWishlist.vue';
import ProfileAvatar from '~/components/profile/ProfileAvatar.vue';
import ProfileInfoForm from '~/components/profile/ProfileInfoForm.vue';
import ProfileSecurity from '~/components/profile/ProfileSecurity.vue';
import AddressManager from '~/components/profile/AddressManager.vue';
import StatusOverlay from '~/components/profile/StatusOverlay.vue';
import Button from '~/components/ui/Button.vue';

useHead({
  title: 'Dashboard — Sellora',
  meta: [
    { name: 'description', content: 'Your Sellora customer dashboard. Manage orders, profile, addresses, and more.' },
  ],
});

const authStore = useAuthStore();

// ===================== State =====================
const loading = ref(true);
const saving = ref(false);
const status = ref<'idle' | 'checking' | 'success' | 'error'>('idle');
const attempt = ref(0);
const localError = ref('');
const avatarUploading = ref(false);
const avatarVersion = ref(0);
const activeSection = ref('overview');

// Form data
const formData = reactive({
  name: '',
  phone: '',
});

// Track which fields have no data in the database
const emptyDbFields = ref<string[]>([]);

// Validation errors
const fieldErrors = reactive({
  name: '',
  phone: '',
});

// ===================== Computed =====================
const user = computed<AuthUser | null>(() => authStore.user);
const avatarSrc = computed<string | null>(() => {
  void avatarVersion.value;
  const avatarUrl = authStore.user?.avatarUrl;
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const config = useRuntimeConfig();
  return `${config.public.apiBase.replace('/api', '')}${avatarUrl}`;
});
const userInitials = computed<string>(() => authStore.userInitials);
const userRole = computed<string>(() => {
  const role = user.value?.role || '';
  switch (role) {
    case 'CUSTOMER': return 'Customer';
    case 'VENDOR': return 'Seller';
    case 'SERVICE_PROVIDER': return 'Service Provider';
    case 'DELIVERY_PARTNER': return 'Delivery Partner';
    case 'ADMIN': return 'Administrator';
    default: return role;
  }
});

// ===================== Lifecycle =====================
onMounted(async () => {
  try {
    const profile = await authStore.fetchFullProfile();
    if (profile) {
      formData.name = profile.name || '';
      formData.phone = profile.phone || '';
      const empty: string[] = [];
      if (!profile.name) empty.push('name');
      if (!profile.phone) empty.push('phone');
      emptyDbFields.value = empty;
    }
  } catch {
    if (authStore.user) {
      formData.name = authStore.user.name || '';
      formData.phone = authStore.user.phone || '';
      const empty: string[] = [];
      if (!authStore.user.name) empty.push('name');
      if (!authStore.user.phone) empty.push('phone');
      emptyDbFields.value = empty;
    }
  } finally {
    loading.value = false;
  }
});

// ===================== Validation =====================
function validateForm(): boolean {
  fieldErrors.name = '';
  fieldErrors.phone = '';
  let valid = true;

  if (!formData.name.trim()) {
    fieldErrors.name = 'Full name is required';
    valid = false;
  } else if (formData.name.trim().length < 2) {
    fieldErrors.name = 'Name must be at least 2 characters';
    valid = false;
  }

  if (formData.phone && !/^\+?[0-9]{7,15}$/.test(formData.phone)) {
    fieldErrors.phone = 'Enter a valid phone number';
    valid = false;
  }

  return valid;
}

// ===================== Actions =====================
async function handleSave() {
  localError.value = '';

  if (!validateForm()) {
    localError.value = 'Please fix the errors above';
    return;
  }

  if (formData.name === (authStore.user?.name || '') && formData.phone === (authStore.user?.phone || '')) {
    localError.value = 'No changes to save';
    return;
  }

  attempt.value += 1;
  saving.value = true;
  status.value = 'checking';

  const ok = await authStore.updateProfile({
    name: formData.name.trim(),
    phone: formData.phone.trim(),
  });

  if (ok) {
    status.value = 'success';
    setTimeout(() => {
      status.value = 'idle';
    }, 2000);
  } else {
    saving.value = false;
    status.value = 'error';
    localError.value = authStore.error || 'Failed to update profile';
    setTimeout(() => {
      if (status.value === 'error') status.value = 'idle';
    }, 2000);
  }
}

async function handleAvatarUpload(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    localError.value = 'Image must be under 5MB';
    return;
  }

  avatarUploading.value = true;
  localError.value = '';

  const ok = await authStore.uploadAvatar(file);

  if (ok) {
    attempt.value += 1;
    avatarVersion.value += 1;
    status.value = 'success';
    setTimeout(() => {
      status.value = 'idle';
    }, 2000);
  } else {
    localError.value = authStore.error || 'Failed to upload avatar';
  }

  avatarUploading.value = false;
}

function handleLogout() {
  authStore.logout();
}

function handleSectionChange(section: string) {
  activeSection.value = section;
}
</script>

<template>
  <div class="min-h-[calc(100vh-73px)] bg-[#F4F6F5] flex">
    <!-- Sidebar -->
    <DashboardSidebar
      :active-section="activeSection"
      @update:active-section="handleSectionChange"
    />

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Loading State -->
        <div v-if="loading" class="space-y-6">
          <div class="animate-pulse space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div class="space-y-2 flex-1">
                <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="h-10 bg-gray-200 rounded w-full"></div>
              <div class="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>

        <!-- ==================== SECTION: Overview ==================== -->
        <DashboardOverview
          v-if="activeSection === 'overview'"
          @navigate="handleSectionChange"
        />

        <!-- ==================== SECTION: Profile ==================== -->
        <div v-if="activeSection === 'profile'" class="space-y-8">
          <!-- Profile Header Card -->
          <div class="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
            <div class="absolute inset-0 h-32 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <div class="relative px-6 sm:px-8 pt-8 pb-10">
              <ProfileAvatar
                :src="avatarSrc"
                :initials="userInitials"
                :name="user?.name"
                :email="user?.email"
                :role="userRole"
                :created-at="user?.createdAt"
                :uploading="avatarUploading"
                @upload="handleAvatarUpload"
              />
            </div>
          </div>

          <!-- Personal Info Form -->
          <div class="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-900/5">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Account Details</h3>
              <p class="mt-1 text-sm text-gray-500">Update your account information and manage your personal data.</p>
            </div>

            <ProfileInfoForm
              :fields="[
                { key: 'name', label: 'Full name', type: 'text', placeholder: 'John Doe', required: true },
                { key: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com', disabled: true, helpText: 'Email cannot be changed. Contact support for updates.' },
                { key: 'phone', label: 'Phone number', type: 'tel', placeholder: '+1 234 567 8900', required: false },
              ]"
              :model-value="{ name: formData.name, email: user?.email || '', phone: formData.phone }"
              @update:model-value="(val) => { formData.name = val.name ?? formData.name; formData.phone = val.phone ?? formData.phone; }"
              :empty-fields="emptyDbFields"
              :submitting="saving"
              :status="status"
              :error-text="localError"
              :validation-errors="fieldErrors"
              @submit="handleSave"
            >
              <template #actions>
                <div class="flex flex-col-reverse sm:flex-row items-center gap-3 pt-6 mt-6 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 flex items-center justify-center"
                    @click="handleLogout"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                  </Button>

                  <Button
                    type="submit"
                    :loading="saving"
                    variant="primary"
                    class="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl shadow-md hover:shadow-lg hover:from-teal-700 hover:to-emerald-700 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    <svg v-if="!saving" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {{ saving ? 'Saving...' : 'Save changes' }}
                  </Button>
                </div>
              </template>

              <template #overlay>
                <StatusOverlay :status="status" success-text="Profile updated successfully" error-text="Could not update profile" />
              </template>
            </ProfileInfoForm>
          </div>
        </div>

        <!-- ==================== SECTION: Orders ==================== -->
        <DashboardOrders v-if="activeSection === 'orders'" />

        <!-- ==================== SECTION: Wishlist ==================== -->
        <DashboardWishlist v-if="activeSection === 'wishlist'" />

        <!-- ==================== SECTION: Addresses ==================== -->
        <div v-if="activeSection === 'addresses'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">My Addresses</h2>
            <p class="text-sm text-gray-500 mt-1">Manage your delivery addresses.</p>
          </div>
          <div class="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-900/5">
            <AddressManager />
          </div>
        </div>

        <!-- ==================== SECTION: Security ==================== -->
        <div v-if="activeSection === 'security'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Account Security</h2>
            <p class="text-sm text-gray-500 mt-1">Manage your password and account safety.</p>
          </div>
          <ProfileSecurity :email="user?.email" />
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth section transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

