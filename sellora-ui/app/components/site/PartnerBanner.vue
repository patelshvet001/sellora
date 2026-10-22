<script setup lang="ts">
import Button from '~/components/ui/Button.vue';

interface Props {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
}

withDefaults(defineProps<Props>(), {
    title: 'Want to grow your business on Sellora?',
    description:
        'Register as a seller, service provider, or delivery partner and connect with thousands of local customers.',
    buttonText: 'Become a Partner Now',
    buttonLink: '/auth/partner-register',
});
</script>

<template>
    <section class="relative overflow-hidden bg-slate-900 text-white border-t border-slate-800">
        <!-- Ambient gradient mesh, decorative only -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                class="absolute -left-20 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[#3C3489]/25 blur-3xl animate-drift-a" />
            <div class="absolute right-0 -top-10 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl animate-drift-b" />
            <div class="absolute inset-0 opacity-[0.03]"
                style="background-image: linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px); background-size: 48px 48px;" />
        </div>

        <div
            class="relative mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-10 items-center">
            <div class="flex flex-col items-center md:items-start text-center md:text-left">
                <span
                    class="inline-flex items-center gap-1.5 rounded-full bg-[#3C3489]/15 border border-[#3C3489]/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#A599F0] mb-3">
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                    </svg>
                    Partner Program
                </span>

                <h2 class="text-2xl md:text-3xl font-bold tracking-tight mb-3 max-w-xl">
                    {{ title }}
                </h2>

                <p class="text-slate-400 text-sm max-w-md leading-relaxed">
                    {{ description }}
                </p>
            </div>

            <Button :to="buttonLink" as="NuxtLink" size="lg"
                class="group relative w-full md:w-auto justify-self-center md:justify-self-end bg-[#3C3489] hover:bg-[#4A40A8] text-white font-semibold whitespace-nowrap shadow-lg shadow-[#3C3489]/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#3C3489]/40">
                <span class="inline-flex items-center justify-center gap-2">
                    {{ buttonText }}
                    <svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </span>
            </Button>
        </div>
    </section>
</template>

<style scoped>
@keyframes drift-a {

    0%,
    100% {
        transform: translate(0, -50%) scale(1);
    }

    50% {
        transform: translate(24px, -50%) scale(1.12);
    }
}

@keyframes drift-b {

    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }

    50% {
        transform: translate(-20px, 16px) scale(1.08);
    }
}

.animate-drift-a {
    animation: drift-a 13s ease-in-out infinite;
}

.animate-drift-b {
    animation: drift-b 16s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {

    .animate-drift-a,
    .animate-drift-b {
        animation: none;
    }
}
</style>