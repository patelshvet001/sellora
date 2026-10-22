<script setup lang="ts">
const year = new Date().getFullYear();

const links = [
  { label: 'Shop', to: '/shop' },
  { label: 'Services', to: '/services' },
  { label: 'Become a Partner', to: '/auth/partner-register' },
  { label: 'Privacy', to: '/privacy' },
];

const socials = [
  { label: 'Instagram', href: '#', path: 'M12 2c2.7 0 3.1 0 4.1.1 1.1 0 1.8.2 2.4.5.7.2 1.2.6 1.7 1.1.5.5.9 1 1.1 1.7.2.6.4 1.3.5 2.4 0 1 .1 1.4.1 4.1s0 3.1-.1 4.1c0 1.1-.2 1.8-.5 2.4a4.9 4.9 0 01-1.1 1.7 4.9 4.9 0 01-1.7 1.1c-.6.2-1.3.4-2.4.5-1 0-1.4.1-4.1.1s-3.1 0-4.1-.1c-1.1 0-1.8-.2-2.4-.5a4.9 4.9 0 01-1.7-1.1 4.9 4.9 0 01-1.1-1.7c-.2-.6-.4-1.3-.5-2.4C2 15.1 2 14.7 2 12s0-3.1.1-4.1c0-1.1.2-1.8.5-2.4.2-.7.6-1.2 1.1-1.7.5-.5 1-.9 1.7-1.1.6-.2 1.3-.4 2.4-.5C8.9 2 9.3 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-8.4a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z' },
  { label: 'X', href: '#', path: 'M18.9 3H22l-7.2 8.2L23.3 21H16.9l-5-6.5-5.7 6.5H2.9l7.7-8.8L2 3h6.6l4.5 6 5.8-6z' },
  { label: 'LinkedIn', href: '#', path: 'M6.9 8.4H3.3V21h3.6V8.4zM5.1 3a2.1 2.1 0 100 4.2 2.1 2.1 0 000-4.2zM21 21h-3.6v-6.2c0-1.5-.5-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V21h-3.6V8.4h3.5v1.6c.5-.7 1.3-1.8 3.2-1.8 2.3 0 4 1.5 4 4.8V21z' },
];
</script>

<template>
  <footer class="bg-gray-950 text-gray-400 border-t border-gray-800">
    <div
      class="mx-auto max-w-7xl px-5 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">

      <!-- Brand -->
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
          <img src="~/assets/logo.png" alt="Sellora"
            class="h-9 w-auto transition-transform duration-300 group-hover:scale-105">
      </NuxtLink>

      <!-- Links -->
      <nav class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to"
          class="hover:text-lime-300 transition-colors duration-150">
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Socials -->
      <div class="flex items-center gap-2 shrink-0">
        <a v-for="s in socials" :key="s.label" :href="s.href" target="_blank" rel="noopener noreferrer"
          class="h-7 w-7 rounded-md bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-black hover:bg-lime-400 hover:border-lime-400 transition-colors duration-150"
          :aria-label="s.label">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current">
            <path :d="s.path" />
          </svg>
        </a>
      </div>
    </div>

    <div class="border-t border-gray-900">
      <p class="max-w-7xl mx-auto px-5 sm:px-6 py-3 text-center text-[12px] text-gray-600">
        © {{ year }} Sellora Inc. All rights reserved.
      </p>
    </div>
  </footer>
</template>