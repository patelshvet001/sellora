<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import Card from '~/components/ui/Card.vue';
import Button from '~/components/ui/Button.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Modal from '~/components/ui/Modal.vue';
import { useAdminStore } from '~/stores/admin';
import { useAdminNav } from '~/composables/useAdminNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'] });
useHead({ title: 'User Details — Sellora Admin' });

const route = useRoute();
const adminStore = useAdminStore();
const { navItems } = useAdminNav();

const showEditModal = ref(false);
const saving = ref(false);
const form = ref({ name: '', phone: '', role: '', isVerified: false, isActive: true });

async function load() {
  const user = await adminStore.fetchUser(String(route.params.id));
  if (user) {
    form.value = {
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      isVerified: !!user.isVerified,
      isActive: !!user.isActive,
    };
  }
}

async function handleSave() {
  saving.value = true;
  const ok = await adminStore.updateUser(route.params.id as string, form.value);
  saving.value = false;
  if (ok) {
    showEditModal.value = false;
  }
}

async function toggleActive() {
  if (adminStore.currentUser) {
    await adminStore.setUserActive(adminStore.currentUser.id, !adminStore.currentUser.isActive);
  }
}

onMounted(load);
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Admin" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <NuxtLink to="/admin/users" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 mb-6 transition-colors">
        ← Back to users
      </NuxtLink>

      <div v-if="adminStore.loading || !adminStore.currentUser" class="text-center py-20 text-gray-400">
        Loading user details...
      </div>

      <div v-else class="space-y-6">
        <!-- Header Profile Card -->
        <Card class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 text-2xl font-black shrink-0">
              {{ adminStore.currentUser.name?.[0]?.toUpperCase() || 'U' }}
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-black text-gray-900">{{ adminStore.currentUser.name }}</h1>
                <StatusBadge :status="adminStore.currentUser.isActive ? 'ACTIVE' : 'DEACTIVATED'" />
                <StatusBadge :status="adminStore.currentUser.isVerified ? 'APPROVED' : 'PENDING'" />
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ adminStore.currentUser.email }} · Phone: {{ adminStore.currentUser.phone || 'Not provided' }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                Joined {{ new Date(adminStore.currentUser.createdAt).toLocaleDateString() }} · Role: <span class="font-bold text-teal-700 uppercase">{{ adminStore.currentUser.role }}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Button variant="secondary" size="sm" @click="showEditModal = true">Edit details</Button>
            <Button
              size="sm"
              :variant="adminStore.currentUser.isActive ? 'danger' : 'success'"
              @click="toggleActive"
            >
              {{ adminStore.currentUser.isActive ? 'Deactivate' : 'Activate' }}
            </Button>
          </div>
        </Card>

        <!-- Role-Specific Profiles -->
        <Card v-if="adminStore.currentUser.vendorProfile" class="border-l-4 border-l-amber-500">
          <h3 class="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
            <span>🏪</span> Vendor Profile
          </h3>
          <div class="grid md:grid-cols-3 gap-4 text-sm">
            <div><p class="text-xs text-gray-400">Store Name</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.vendorProfile.storeName }}</p></div>
            <div><p class="text-xs text-gray-400">Category</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.vendorProfile.category }}</p></div>
            <div><p class="text-xs text-gray-400">GST Number</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.vendorProfile.gstNumber || 'N/A' }}</p></div>
            <div class="col-span-2"><p class="text-xs text-gray-400">Address</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.vendorProfile.address }}, {{ adminStore.currentUser.vendorProfile.city }} - {{ adminStore.currentUser.vendorProfile.pincode }}</p></div>
            <div><p class="text-xs text-gray-400">Approval Status</p><StatusBadge :status="adminStore.currentUser.vendorProfile.isApproved ? 'APPROVED' : 'PENDING'" /></div>
          </div>
        </Card>

        <Card v-if="adminStore.currentUser.providerProfile" class="border-l-4 border-l-sky-500">
          <h3 class="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
            <span>🧰</span> Service Provider Profile
          </h3>
          <div class="grid md:grid-cols-3 gap-4 text-sm">
            <div><p class="text-xs text-gray-400">Business Name</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.providerProfile.businessName }}</p></div>
            <div><p class="text-xs text-gray-400">Category</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.providerProfile.category }}</p></div>
            <div><p class="text-xs text-gray-400">City</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.providerProfile.city }} - {{ adminStore.currentUser.providerProfile.pincode }}</p></div>
            <div class="col-span-2"><p class="text-xs text-gray-400">Bio</p><p class="text-gray-800">{{ adminStore.currentUser.providerProfile.bio || 'No bio' }}</p></div>
            <div><p class="text-xs text-gray-400">Approval Status</p><StatusBadge :status="adminStore.currentUser.providerProfile.isApproved ? 'APPROVED' : 'PENDING'" /></div>
          </div>
        </Card>

        <Card v-if="adminStore.currentUser.deliveryProfile" class="border-l-4 border-l-emerald-500">
          <h3 class="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
            <span>🛵</span> Delivery Partner Profile
          </h3>
          <div class="grid md:grid-cols-3 gap-4 text-sm">
            <div><p class="text-xs text-gray-400">Vehicle Type</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.deliveryProfile.vehicleType }}</p></div>
            <div><p class="text-xs text-gray-400">Vehicle Number</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.deliveryProfile.vehicleNumber }}</p></div>
            <div><p class="text-xs text-gray-400">License Number</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.deliveryProfile.licenseNumber }}</p></div>
            <div><p class="text-xs text-gray-400">City</p><p class="font-semibold text-gray-800">{{ adminStore.currentUser.deliveryProfile.city }}</p></div>
            <div><p class="text-xs text-gray-400">Approval Status</p><StatusBadge :status="adminStore.currentUser.deliveryProfile.isApproved ? 'APPROVED' : 'PENDING'" /></div>
          </div>
        </Card>

        <!-- Addresses -->
        <Card>
          <h3 class="font-bold text-gray-900 text-base mb-3">Saved Addresses</h3>
          <div v-if="!adminStore.currentUser.addresses?.length" class="text-sm text-gray-400">No addresses saved.</div>
          <div v-else class="grid md:grid-cols-2 gap-3">
            <div v-for="a in adminStore.currentUser.addresses" :key="a.id" class="p-3 border border-gray-100 rounded-xl bg-gray-50/50 text-sm">
              <span class="font-bold text-xs text-teal-600 block mb-1">{{ a.label }}</span>
              <p class="text-gray-800">{{ a.line1 }} {{ a.line2 }}</p>
              <p class="text-xs text-gray-500">{{ a.city }}, {{ a.state }} - {{ a.pincode }}</p>
            </div>
          </div>
        </Card>

        <!-- Recent Orders / Bookings -->
        <div class="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 class="font-bold text-gray-900 text-base mb-3">Recent Orders</h3>
            <div v-if="!adminStore.currentUser.orders?.length" class="text-sm text-gray-400">No orders placed.</div>
            <div v-else class="space-y-2">
              <div v-for="o in adminStore.currentUser.orders" :key="o.id" class="flex items-center justify-between text-sm p-2 border-b border-gray-50">
                <div>
                  <p class="font-semibold text-gray-800">{{ o.orderNumber }}</p>
                  <p class="text-xs text-gray-400">{{ new Date(o.createdAt).toLocaleDateString() }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-gray-900">₹{{ o.total }}</p>
                  <StatusBadge :status="o.status" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 class="font-bold text-gray-900 text-base mb-3">Recent Bookings</h3>
            <div v-if="!adminStore.currentUser.bookings?.length" class="text-sm text-gray-400">No bookings made.</div>
            <div v-else class="space-y-2">
              <div v-for="b in adminStore.currentUser.bookings" :key="b.id" class="flex items-center justify-between text-sm p-2 border-b border-gray-50">
                <div>
                  <p class="font-semibold text-gray-800">{{ b.bookingNo }}</p>
                  <p class="text-xs text-gray-400">{{ new Date(b.scheduledAt).toLocaleDateString() }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-gray-900">₹{{ b.price }}</p>
                  <StatusBadge :status="b.status" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Edit Modal -->
      <Modal v-model="showEditModal" title="Edit User Details">
        <form class="space-y-4" @submit.prevent="handleSave">
          <div>
            <label class="text-xs font-semibold text-gray-600">Full Name</label>
            <input v-model="form.name" required class="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Phone</label>
            <input v-model="form.phone" class="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Role</label>
            <select v-model="form.role" class="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm">
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="VENDOR">VENDOR</option>
              <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
              <option value="DELIVERY_PARTNER">DELIVERY_PARTNER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div class="flex gap-6 pt-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input v-model="form.isVerified" type="checkbox" class="rounded text-teal-600" />
              <span>Email Verified</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input v-model="form.isActive" type="checkbox" class="rounded text-teal-600" />
              <span>Account Active</span>
            </label>
          </div>

          <div class="flex gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" class="flex-1" @click="showEditModal = false">Cancel</Button>
            <Button type="submit" class="flex-1" :loading="saving">Save changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  </div>
</template>
