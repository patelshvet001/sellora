// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Sellora',
      titleTemplate: '%s — Sellora',
      meta: [
        { name: 'description', content: 'Sellora — shop from local vendors, book trusted service providers, and get it all delivered by verified delivery partners.' },
        { name: 'theme-color', content: '#0f766e' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicon.png' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000/api'
    }
  },
  modules: [
    "@nuxt/icon",
    "@nuxt/fonts",
    "nuxt-api-party",
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt"
  ],
  nitro: {
    storage: {
      shield: { driver: "fs", base: "./shield" }
    }
  },
  apiParty: {
    endpoints: {
      selloraApi: {
        url: process.env.SELLORA_API_URL || "http://localhost:4000/api"
      }
    }
  }
})