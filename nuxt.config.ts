export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  modules: ['vuetify-nuxt-module'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Taseron Management',
      meta: [{ name: 'description', content: 'Taseron Management — Tenant Yönetimi' }],
    },
  },
  vuetify: {
    moduleOptions: {
      // styles: true (default) — SSR-friendly Vuetify styles
    },
    vuetifyOptions: {
      icons: {
        defaultSet: 'mdi',
      },
      defaults: {
        VBtn: { style: 'text-transform: none; letter-spacing: normal;' },
      },
      theme: {
        defaultTheme: 'taseronLight',
        themes: {
          taseronLight: {
            dark: false,
            colors: {
              primary: '#6D5DFB',
              'primary-darken-1': '#5B4CE0',
              secondary: '#64748B',
              success: '#10B981',
              warning: '#F59E0B',
              error: '#EF4444',
              info: '#3B82F6',
              background: '#F6F5FC',
              surface: '#FFFFFF',
              'surface-variant': '#F1F5F9',
              'on-background': '#1E293B',
              'on-surface': '#1E293B',
            },
          },
          taseronDark: {
            dark: true,
            colors: {
              primary: '#8B7BFF',
              'primary-darken-1': '#6D5DFB',
              secondary: '#94A3B8',
              success: '#34D399',
              warning: '#FBBF24',
              error: '#F87171',
              info: '#60A5FA',
              background: '#0F1115',
              surface: '#181A22',
              'surface-variant': '#232631',
              'on-background': '#E2E8F0',
              'on-surface': '#E2E8F0',
            },
          },
        },
      },
    },
  },
})
