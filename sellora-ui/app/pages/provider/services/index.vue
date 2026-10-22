<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoleSidebar from '~/components/dashboard/RoleSidebar.vue';
import Card from '~/components/ui/Card.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Button from '~/components/ui/Button.vue';
import Modal from '~/components/ui/Modal.vue';
import EmptyState from '~/components/ui/EmptyState.vue';
import { useProviderStore } from '~/stores/provider';
import { useProviderNav } from '~/composables/useProviderNav';

definePageMeta({ middleware: ['auth', 'role'], roles: ['SERVICE_PROVIDER'] });
useHead({ title: 'My Services — Sellora Provider' });

const providerStore = useProviderStore();
const { navItems } = useProviderNav();

const showForm = ref(false);
const editing = ref<any | null>(null);
const saving = ref(false);
const form = ref({ title: '', slug: '', price: '', durationMins: '60', description: '', imageUrl: '' });

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function resetForm() {
  form.value = { title: '', slug: '', price: '', durationMins: '60', description: '', imageUrl: '' };
  editing.value = null;
}

function openNew() {
  resetForm();
  showForm.value = true;
}

function openEdit(s: any) {
  editing.value = s;
  form.value = {
    title: s.title, slug: s.slug, price: String(s.price), durationMins: String(s.durationMins),
    description: s.description || '', imageUrl: s.imageUrl || '',
  };
  showForm.value = true;
}

async function save() {
  saving.value = true;
  let ok;
  if (editing.value) {
    ok = await providerStore.updateService(editing.value.id, {
      title: form.value.title,
      price: Number(form.value.price),
      durationMins: Number(form.value.durationMins),
      description: form.value.description || undefined,
      imageUrl: form.value.imageUrl || undefined,
    });
  } else {
    ok = await providerStore.createService({
      title: form.value.title,
      slug: form.value.slug || slugify(form.value.title),
      price: Number(form.value.price),
      durationMins: Number(form.value.durationMins),
      description: form.value.description || undefined,
      imageUrl: form.value.imageUrl || undefined,
    });
  }
  saving.value = false;
  if (ok) {
    showForm.value = false;
    resetForm();
    await providerStore.fetchServices();
  }
}

async function toggleActive(s: any) {
  await providerStore.updateService(s.id, { isActive: !s.isActive });
  await providerStore.fetchServices();
}

async function remove(s: any) {
  if (confirm(`Delete "${s.title}"? This cannot be undone.`)) {
    await providerStore.deleteService(s.id);
  }
}

onMounted(() => providerStore.fetchServices());
</script>

<template>
  <div class="lg:flex min-h-[calc(100vh-73px)] bg-gray-50/40">
    <RoleSidebar title="Service Provider" :items="navItems" />
    <div class="flex-1 px-6 py-8 max-w-5xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-black text-gray-900">Services</h1>
        <Button size="sm" @click="openNew">+ Add service</Button>
      </div>

      <div v-if="providerStore.loading" class="text-gray-400 text-center py-16">Loading services...</div>
      <EmptyState
        v-else-if="!providerStore.services.length"
        icon="🧰"
        title="No Services Listed"
        description="You haven't added any services for customers to book yet."
        action-text="+ Add First Service"
        @action="openNew"
      />

      <div v-else class="space-y-3">
        <Card v-for="s in providerStore.services" :key="s.id" class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="s.imageUrl" :src="s.imageUrl" class="w-full h-full object-cover" />
            <span v-else class="text-xl">🧰</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 truncate">{{ s.title }}</p>
            <p class="text-xs text-gray-400">Duration: {{ s.durationMins }} mins</p>
          </div>
          <p class="font-bold text-gray-900 w-20 text-right">₹{{ s.price }}</p>
          <StatusBadge :status="s.isActive ? 'ACTIVE' : 'DEACTIVATED'" />
          <div class="flex gap-3 ml-2">
            <button class="text-xs font-semibold text-teal-600 hover:underline" @click="openEdit(s)">Edit</button>
            <button class="text-xs font-semibold text-gray-500 hover:underline" @click="toggleActive(s)">{{ s.isActive ? 'Hide' : 'Show' }}</button>
            <button class="text-xs font-semibold text-rose-600 hover:underline" @click="remove(s)">Delete</button>
          </div>
        </Card>
      </div>

      <Modal v-model="showForm" :title="editing ? 'Edit Service' : 'Add New Service'" max-width="lg">
        <form class="space-y-4" @submit.prevent="save">
          <div>
            <label class="text-xs font-semibold text-gray-600">Service Title</label>
            <input v-model="form.title" required class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-gray-600">Price (₹)</label>
              <input v-model="form.price" type="number" min="0" step="0.01" required class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600">Duration (Minutes)</label>
              <input v-model="form.durationMins" type="number" min="10" required class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Image URL</label>
            <input v-model="form.imageUrl" placeholder="https://..." class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600">Description</label>
            <textarea v-model="form.description" rows="3" class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm"></textarea>
          </div>
          <p v-if="providerStore.error" class="text-sm text-rose-600">{{ providerStore.error }}</p>
          <div class="flex gap-3 pt-2">
            <Button type="button" variant="secondary" class="flex-1" @click="showForm = false">Cancel</Button>
            <Button type="submit" class="flex-1" :loading="saving">{{ editing ? 'Save changes' : 'Add service' }}</Button>
          </div>
        </form>
      </Modal>
    </div>
  </div>
</template>
