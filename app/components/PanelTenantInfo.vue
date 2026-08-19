<template>
  <aside class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="mb-4 flex items-center gap-2">
      <span class="text-brand-500"><CircleHelp :size="18" /></span>
      <h3 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">Tenant Nedir?</h3>
    </div>

    <p class="text-theme-sm leading-6 text-gray-500 dark:text-gray-400">Tenant, sistemde bağımsız bir müşteri veya çalışma alanı oluşturur.</p>
    <p class="mt-2 text-theme-sm leading-6 text-gray-500 dark:text-gray-400">Her tenant kendi organizasyon yapısına, kullanıcılarına ve verilerine sahip olur.</p>

    <div class="my-5 border-t border-gray-200 dark:border-gray-800" />

    <h4 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Oluşturma Adımları</h4>
    <div class="space-y-4">
      <div v-for="(step, index) in steps" :key="step.title" class="flex items-start gap-3">
        <span :class="['flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-theme-xs font-medium', index === 0 ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400']">{{ index + 1 }}</span>
        <div>
          <div class="text-sm font-medium text-gray-800 dark:text-white/90">{{ step.title }}</div>
          <div class="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{{ step.desc }}</div>
        </div>
      </div>
    </div>

    <div class="mt-5 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/10">
      <div class="text-sm font-semibold text-brand-600 dark:text-brand-400">İpucu</div>
      <div class="mt-1 text-theme-xs text-brand-700 dark:text-brand-400">Tenant oluşturulduktan sonra organizasyon yapınızı detaylandırabilirsiniz.</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { CircleHelp } from '@lucide/vue'

const steps = [
  { title: 'Tenant Bilgileri', desc: 'Tenant hesabınızın temel bilgilerini girin.' },
  { title: 'İlk Organizasyon', desc: 'İlk organizasyon düğümünü tanımlayın.' },
  { title: 'Kontrol & Oluştur', desc: "Bilgilerinizi kontrol edin ve tenant'ı oluşturun." },
]
</script>
