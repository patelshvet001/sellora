<template>
    <section class="relative flex flex-col min-h-[560px] sm:min-h-[640px] lg:min-h-[82vh] xl:min-h-[86vh] overflow-hidden text-white">
        <!-- Background Image, slow Ken-Burns zoom -->
        <div class="absolute inset-0 bg-cover bg-center animate-kenburns" :style="{
            backgroundImage:
                'url(https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2000&auto=format&fit=crop)',
        }" />

        <!-- Overlay -->
        <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/20"></div>

        <!-- Blur -->
        <div class="absolute inset-0 backdrop-blur-[2px]"></div>

        <!-- Announcement banner -->
        <Transition name="banner">
            <div v-if="showBanner" class="relative z-30 bg-lime-400 text-black">
                <div class="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-center">
                    <span>🎉 Launch week: free delivery on your first 3 orders</span>
                    <NuxtLink to="/shop" class="underline underline-offset-2 hover:no-underline shrink-0">Shop now</NuxtLink>
                    <button
                        class="absolute right-4 sm:right-6 h-6 w-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                        aria-label="Dismiss announcement"
                        @click="showBanner = false"
                    >
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </Transition>

        <!-- Hero -->
        <div class="relative z-20 flex-1 max-w-7xl mx-auto w-full px-5 sm:px-6 py-10 sm:py-14 lg:py-16 flex items-center">
            <div class="max-w-3xl">

                <div
                    class="animate-fade-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-white/20 mb-5 sm:mb-7"
                    style="animation-delay: 0ms"
                >
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-lime-400 animate-pulse"></span>
                    <span class="text-xs sm:text-sm">
                        Next Generation Local Marketplace
                    </span>
                </div>

                <h1
                    class="animate-fade-up text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08]"
                    style="animation-delay: 80ms"
                >
                    Shop Local for
                    <br />
                    <span class="italic font-light text-lime-300">
                        Future Generations
                    </span>
                </h1>

                <p
                    class="animate-fade-up text-gray-200 text-sm sm:text-base md:text-lg mt-4 sm:mt-6 max-w-xl leading-6 sm:leading-7 md:leading-8"
                    style="animation-delay: 160ms"
                >
                    Buy products, book verified professionals, and get
                    everything delivered in minutes with one seamless
                    marketplace experience.
                </p>

                <!-- Buttons -->
                <div class="animate-fade-up flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8" style="animation-delay: 240ms">
                    <NuxtLink to="/shop"
                        class="group px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-lime-400/30 transition-all duration-200 inline-flex items-center gap-1.5">
                        Explore Shop
                        <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </NuxtLink>

                    <NuxtLink to="/services"
                        class="px-5 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/40 backdrop-blur-md hover:bg-white/10 hover:border-white/60 hover:-translate-y-0.5 transition-all duration-200">
                        Book Services
                    </NuxtLink>
                </div>

                <!-- Bottom Info -->
                <div class="animate-fade-up mt-8 sm:mt-12 flex flex-wrap items-center gap-6 sm:gap-8 md:gap-10" style="animation-delay: 320ms">
                    <div>
                        <p class="text-xl sm:text-2xl md:text-3xl font-bold">4.9 ★</p>
                        <p class="text-gray-300 text-[11px] sm:text-xs md:text-sm">Customer Rating</p>
                    </div>
                    <div>
                        <p class="text-xl sm:text-2xl md:text-3xl font-bold">10K+</p>
                        <p class="text-gray-300 text-[11px] sm:text-xs md:text-sm">Happy Customers</p>
                    </div>
                    <div>
                        <p class="text-xl sm:text-2xl md:text-3xl font-bold">500+</p>
                        <p class="text-gray-300 text-[11px] sm:text-xs md:text-sm">Local Partners</p>
                    </div>
                </div>
            </div>

            <!-- Floating promo card, desktop only, idle float -->
            <div
                class="animate-fade-up animate-float hidden xl:block absolute right-6 bottom-10 w-64 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-2xl"
                style="animation-delay: 400ms"
            >
                <p class="text-[11px] font-semibold uppercase tracking-widest text-lime-300 mb-1.5">Flash sale</p>
                <p class="text-lg font-bold leading-snug">Up to 50% off local favorites</p>
                <p class="text-xs text-gray-300 mt-1.5">Ends in 2 days</p>
                <NuxtLink to="/deals" class="group inline-flex items-center gap-1 mt-3 text-sm font-semibold text-lime-300 hover:text-lime-200">
                    View deals
                    <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </NuxtLink>
            </div>
        </div>

        <!-- Scroll cue -->
        <button
            class="hidden sm:flex relative z-20 mx-auto mb-4 items-center gap-2 text-white/70 text-[11px] font-semibold tracking-widest uppercase hover:text-white transition-colors"
            @click="$emit('scroll-down')"
        >
            Scroll
            <svg class="h-3 w-3 animate-bounce-y" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M6 13l6 6 6-6" />
            </svg>
        </button>

        <!-- Brands -->
        <div class="relative z-20 bg-white text-gray-700">
            <div
                class="max-w-7xl mx-auto py-4 sm:py-6 px-5 sm:px-6 flex flex-wrap justify-between gap-x-6 sm:gap-x-8 gap-y-2 sm:gap-y-3 text-sm sm:text-lg md:text-xl font-semibold opacity-70">
                <span>SELLORA</span>
                <span>ONEVERSE AI</span>
                <span>LOCAL STORE</span>
                <span>FAST DELIVERY</span>
                <span>SMART SERVICE</span>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref } from 'vue';

defineEmits(['scroll-down']);

const showBanner = ref(true);
</script>

<style scoped>
@keyframes bounce-y {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
}
.animate-bounce-y { animation: bounce-y 1.6s ease-in-out infinite; }

@keyframes fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}
.animate-float { animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both, float 5s ease-in-out 0.9s infinite; }

@keyframes kenburns {
    0% { transform: scale(1.05); }
    100% { transform: scale(1.16); }
}
.animate-kenburns { animation: kenburns 18s ease-out infinite alternate; }

.banner-enter-active, .banner-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-100%); }

@media (prefers-reduced-motion: reduce) {
    .animate-bounce-y, .animate-fade-up, .animate-float, .animate-kenburns {
        animation: none;
    }
}
</style>