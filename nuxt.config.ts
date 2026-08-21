import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'lucide-vue-next': '@lucide/vue',
      },
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
    },
  },
  app: {
    head: {
      title: 'Taseron Management',
      meta: [{ name: 'description', content: 'Taseron Management — Tenant Yönetimi' }],
    },
  },
})
