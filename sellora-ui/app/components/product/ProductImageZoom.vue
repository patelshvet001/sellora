<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  src?: string;
  alt?: string;
}>();

const containerRef = ref<HTMLElement | null>(null);
const isHovering = ref(false);
const cursorPos = ref({ x: 50, y: 50 });
const showLens = ref(false);

function onMouseMove(e: MouseEvent) {
  const el = containerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  cursorPos.value = {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
  showLens.value = true;
}

function onMouseEnter() {
  isHovering.value = true;
}

function onMouseLeave() {
  isHovering.value = false;
  showLens.value = false;
}

const bgPosition = computed(() => {
  return `${cursorPos.value.x}% ${cursorPos.value.y}%`;
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full aspect-square overflow-hidden select-none"
    style="background: radial-gradient(circle at center, #FAF8F3 0%, #F0ECE4 100%); cursor: crosshair;"
    @mouseenter="onMouseEnter"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Main Image -->
    <img
      v-if="src"
      :src="src"
      :alt="alt || ''"
      class="w-full h-full object-contain transition-transform duration-300 ease-out"
      :style="isHovering ? { transform: 'scale(2)', transformOrigin: bgPosition } : {}"
      draggable="false"
    />

    <!-- Lens circle overlay -->
    <div
      v-if="showLens && src"
      class="pointer-events-none absolute w-28 h-28 rounded-full border-2 z-10"
      :style="{
        left: `calc(${cursorPos.x}% - 56px)`,
        top: `calc(${cursorPos.y}% - 56px)`,
        borderColor: 'rgba(139,90,60,0.3)',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.08)',
        background: `url(${src}) no-repeat`,
        backgroundPosition: bgPosition,
        backgroundSize: '300%',
      }"
    />

    <!-- Placeholder -->
    <div v-if="!src" class="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <svg class="w-24 h-24" style="color: #D4C4B0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="0.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span class="text-sm font-medium" style="color: #D4C4B0;">No Image Available</span>
    </div>

    <!-- Zoom hint badge -->
    <div
      v-if="src"
      class="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity duration-300 pointer-events-none"
      :style="{
        backgroundColor: isHovering ? 'rgba(44,36,22,0.6)' : 'rgba(44,36,22,0.4)',
        color: '#fff',
        opacity: isHovering ? '0' : '1',
      }"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
      Hover to zoom
    </div>
  </div>
</template>