<script setup lang="ts">
import { computed } from 'vue';
import Button from '~/components/ui/Button.vue';
import Card from '~/components/ui/Card.vue';
import { useCartStore } from '~/stores/cart';

useHead({ title: 'Your Cart — Sellora' });

const cartStore = useCartStore();
const deliveryFee = computed(() => (cartStore.cartTotal >= 500 || cartStore.cartTotal === 0 ? 0 : 40));
const grandTotal = computed(() => cartStore.cartTotal + deliveryFee.value);
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10">
    <h1 class="text-3xl font-black text-gray-900 mb-8">Your cart</h1>

    <div v-if="!cartStore.items.length" class="text-center py-20">
      <div class="text-4xl mb-3">🛒</div>
      <p class="text-gray-500 mb-5">Your cart is empty.</p>
      <Button as="NuxtLink" to="/shop">Browse products</Button>
    </div>  

    <div v-else class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-3">
        <Card v-for="item in cartStore.items" :key="item.id" class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
            <span v-else class="text-xl">🛍️</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 truncate">{{ item.name }}</p>
            <p class="text-sm text-gray-500">₹{{ item.price }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50" @click="cartStore.updateQuantity(item.id, item.quantity - 1)">−</button>
            <span class="w-6 text-center text-sm font-medium">{{ item.quantity }}</span>
            <button class="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50" @click="cartStore.updateQuantity(item.id, item.quantity + 1)">+</button>
          </div>
          <p class="w-20 text-right font-semibold text-gray-900">₹{{ item.price * item.quantity }}</p>
          <button class="text-gray-400 hover:text-rose-600" @click="cartStore.removeItem(item.id)" aria-label="Remove item">✕</button>
        </Card>
      </div>

      <Card class="h-fit sticky top-6">
        <h2 class="font-bold text-gray-900 mb-4">Order summary</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{{ cartStore.cartTotal }}</span></div>
          <div class="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span>{{ deliveryFee === 0 ? 'Free' : `₹${deliveryFee}` }}</span>
          </div>
          <div v-if="deliveryFee > 0" class="text-xs text-teal-600">Add ₹{{ 500 - cartStore.cartTotal }} more for free delivery</div>
          <div class="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span><span>₹{{ grandTotal }}</span>
          </div>
        </div>
        <Button as="NuxtLink" to="/checkout" class="w-full mt-5">Proceed to checkout</Button>
      </Card>
    </div>
  </div>
</template>
