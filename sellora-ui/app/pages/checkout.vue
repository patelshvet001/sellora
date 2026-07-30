<script setup lang="ts">
/** /checkout — pick address, place order from cart contents */
import { ref, onMounted, computed } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';
import { useCartStore } from '~/stores/cart';
import { useAddressStore } from '~/stores/address';
import { useOrdersStore } from '~/stores/orders';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Checkout — Sellora' });

const cartStore = useCartStore();
const addressStore = useAddressStore();
const ordersStore = useOrdersStore();

const selectedAddressId = ref<number | null>(null);
const paymentMethod = ref<'COD' | 'UPI'>('COD');
const notes = ref('');
const placing = ref(false);

const deliveryFee = computed(() => (cartStore.cartTotal >= 500 || cartStore.cartTotal === 0 ? 0 : 40));
const grandTotal = computed(() => cartStore.cartTotal + deliveryFee.value);

onMounted(async () => {
  await addressStore.fetchAddresses();
  const def = addressStore.addresses.find((a: any) => a.isDefault) || addressStore.addresses[0];
  if (def) selectedAddressId.value = def.id;
});

async function placeOrder() {
  if (!selectedAddressId.value || !cartStore.items.length) return;
  placing.value = true;
  const order = await ordersStore.checkout({
    addressId: selectedAddressId.value,
    paymentMethod: paymentMethod.value,
    notes: notes.value || undefined,
    items: cartStore.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
  });
  placing.value = false;
  if (order) {
    cartStore.clearCart();
    navigateTo(`/orders/${order.id}?placed=1`);
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-10">
    <h1 class="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

    <div v-if="!cartStore.items.length" class="text-center py-16">
      <p class="text-gray-500 mb-5">Your cart is empty.</p>
      <Button as="NuxtLink" to="/shop">Browse products</Button>
    </div>

    <div v-else class="space-y-6">
      <Card>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-gray-900">Delivery address</h2>
          <NuxtLink to="/dashboard?section=addresses" class="text-sm text-teal-600 font-medium">Manage addresses</NuxtLink>
        </div>
        <p v-if="!addressStore.addresses.length" class="text-sm text-gray-500">
          You don't have any saved addresses yet. <NuxtLink to="/dashboard?section=addresses" class="text-teal-600 font-medium">Add one</NuxtLink> to continue.
        </p>
        <div v-else class="space-y-2">
          <label
            v-for="addr in addressStore.addresses"
            :key="addr.id"
            class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
            :class="selectedAddressId === addr.id ? 'border-teal-500 bg-teal-50/50' : 'border-gray-200 hover:bg-gray-50'"
          >
            <input type="radio" class="mt-1" :value="addr.id" v-model="selectedAddressId" />
            <div class="text-sm">
              <p class="font-semibold text-gray-900">{{ addr.label }}</p>
              <p class="text-gray-600">{{ addr.line1 }}, {{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</p>
            </div>
          </label>
        </div>
      </Card>

      <Card>
        <h2 class="font-bold text-gray-900 mb-3">Payment method</h2>
        <div class="flex gap-3">
          <label class="flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer" :class="paymentMethod === 'COD' ? 'border-teal-500 bg-teal-50/50' : 'border-gray-200'">
            <input type="radio" value="COD" v-model="paymentMethod" />
            <span class="text-sm font-medium">Cash on delivery</span>
          </label>
          <label class="flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer" :class="paymentMethod === 'UPI' ? 'border-teal-500 bg-teal-50/50' : 'border-gray-200'">
            <input type="radio" value="UPI" v-model="paymentMethod" />
            <span class="text-sm font-medium">UPI (manual, MVP)</span>
          </label>
        </div>
      </Card>

      <Card>
        <h2 class="font-bold text-gray-900 mb-3">Order summary</h2>
        <div class="space-y-1 text-sm mb-3">
          <div v-for="item in cartStore.items" :key="item.id" class="flex justify-between text-gray-600">
            <span>{{ item.name }} × {{ item.quantity }}</span><span>₹{{ item.price * item.quantity }}</span>
          </div>
        </div>
        <div class="border-t border-gray-100 pt-2 space-y-1 text-sm">
          <div class="flex justify-between text-gray-600"><span>Delivery</span><span>{{ deliveryFee === 0 ? 'Free' : `₹${deliveryFee}` }}</span></div>
          <div class="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>₹{{ grandTotal }}</span></div>
        </div>
      </Card>

      <p v-if="ordersStore.error" class="text-sm text-rose-600">{{ ordersStore.error }}</p>
      <Button class="w-full" size="lg" :disabled="!selectedAddressId" :loading="placing" @click="placeOrder">
        Place order · ₹{{ grandTotal }}
      </Button>
    </div>
  </div>
</template>
