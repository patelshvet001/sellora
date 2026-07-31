<script setup lang="ts">
import ProductDetail from '~/components/product/ProductDetail.vue';

const route = useRoute();

useHead({
  title: computed(() => 'Product Details — Sellora'),
  meta: [
    { name: 'description', content: 'View product details, reviews, and purchase options on Sellora.' },
  ],
});
</script>

<template>
  <ProductDetail :id="route.params.id as string" />
</template>
