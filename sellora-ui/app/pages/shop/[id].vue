<script setup lang="ts">
import ProductDetail from '~/components/product/ProductDetail.vue';

const route = useRoute();

useHead({
  title: computed(() => {
    // Will be overridden dynamically once product loads
    return 'Product Details';
  }),
});
</script>

<template>
  <ProductDetail :id="route.params.id as string" />
</template>

