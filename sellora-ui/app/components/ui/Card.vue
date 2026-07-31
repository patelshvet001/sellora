<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { twMerge } from 'tailwind-merge';
import { useCartStore } from '~/stores/cart';

defineOptions({ inheritAttrs: false });

interface Product {
  id: string | number;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  vendor?: { storeName?: string };
  stock?: number;
  category?: { name?: string; slug?: string };
}

const props = withDefaults(defineProps<{
  hover?: boolean;
  padded?: boolean;
  variant?: 'flat' | 'bordered' | 'glass' | 'accent';
  product: Product;
}>(), {
  hover: false,
  padded: true,
  variant: 'bordered',
});

const attrs = useAttrs();
const cartStore = useCartStore();
const justAdded = ref(false);

const hasDiscount = computed(() => {
  return props.product.discountPrice && Number(props.product.discountPrice) < Number(props.product.price);
});

const discountPercent = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.round(
    ((Number(props.product.price) - Number(props.product.discountPrice)) /
      Number(props.product.price)) *
    100
  );
});

const displayPrice = computed(() => {
  return Number(props.product.discountPrice ?? props.product.price);
});

function addToCart(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  if (!props.product || (props.product.stock ?? 0) <= 0) return;

  cartStore.addItem({
    id: Number(props.product.id),
    name: props.product.name,
    price: displayPrice.value,
    image: props.product.imageUrl || '',
    stock: props.product.stock ?? 0,
  }, 1);

  justAdded.value = true;
  setTimeout(() => (justAdded.value = false), 1200);
}

const className = computed(() => {
  const base = 'rounded-sm transition-all duration-300';

  const padding = props.padded ? 'p-0' : '';

  const hoverClass = props.hover
    ? 'hover:-translate-y-1 hover:shadow-lg'
    : '';

  let variantClass = '';

  if (props.variant === 'glass') {
    variantClass =
      'bg-white/60 backdrop-blur-md border border-white/30 shadow-lg shadow-stone-900/5';
  } else if (props.variant === 'flat') {
    variantClass =
      'border border-transparent shadow-none';
  } else if (props.variant === 'accent') {
    variantClass =
      'bg-white border border-[#D4C4B0] shadow-md shadow-[#2C2416]/5';
  } else {
    variantClass =
      'bg-white border border-[#E0D5C5] shadow-sm shadow-[#2C2416]/5';
  }

  return twMerge(
    `${base} ${padding} ${hoverClass} ${variantClass}`,
    (attrs.class as string) || ''
  );
});

const restAttrs = computed(() => {
  const { class: _omit, ...rest } = attrs as Record<string, unknown>;
  return rest;
});
</script>

<template>
  <NuxtLink v-if="product" :to="'/shop/' + product.id" :class="className" class="group block" v-bind="restAttrs">
    <!-- Image -->
    <div class="relative aspect-square overflow-hidden" style="background-color: #FAF8F3;">
      <!-- Discount Badge -->
      <div v-if="hasDiscount"
        class="absolute top-2.5 left-2.5 z-10 text-white font-bold text-[10px] px-2.5 py-1 rounded-full"
        style="background-color: #E86A33;">
        {{ discountPercent }}% OFF
      </div>

      <!-- Sold Out Overlay -->
      <div v-if="product.stock !== undefined && product.stock <= 0"
        class="absolute inset-0 z-10 flex items-center justify-center"
        style="background-color: rgba(255,255,255,0.75);">
        <span class="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
          style="background-color: #2C2416; color: #fff;">
          Sold Out
        </span>
      </div>

      <!-- Quick Add to Cart Button -->
      <button v-if="(product.stock ?? 0) > 0"
        class="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
        :style="{
          backgroundColor: justAdded ? '#4A7C59' : '#8B5A3C',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }" @click="addToCart">
        <svg v-if="justAdded" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" draggable="false" />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-14 h-14" style="color: #D4C4B0;" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="0.8">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <!-- Info -->
    <div class="p-3.5">
      <div v-if="$slots.header" class="mb-2">
        <slot name="header" />
      </div>

      <p class="text-[11px] truncate" style="color: #999;">
        {{ product.vendor?.storeName || '' }}
      </p>
      <p class="text-sm font-medium line-clamp-2 mt-0.5 leading-snug" style="color: #2C2416;">
        {{ product.name }}
      </p>

      <div class="flex items-baseline gap-2 mt-1.5">
        <span class="text-sm font-bold" style="color: #2C2416;">
          Rs. {{ displayPrice.toLocaleString() }}
        </span>
        <span v-if="hasDiscount" class="text-xs line-through" style="color: #B0A090;">
          Rs. {{ Number(product.price).toLocaleString() }}
        </span>
      </div>

      <div v-if="$slots.footer" class="mt-3 pt-3" style="border-top: 1px solid #E8E2D6;">
        <slot name="footer" />
      </div>
    </div>
  </NuxtLink>
</template>