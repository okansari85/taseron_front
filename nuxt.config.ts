import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost:8000',
    },
  },
  app: {
    head: {
      title: 'Taseron Management',
      meta: [{ name: 'description', content: 'Taseron Management — Tenant Yönetimi' }],
    },
  },
})
