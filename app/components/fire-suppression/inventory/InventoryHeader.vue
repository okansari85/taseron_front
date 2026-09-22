<script setup lang="ts">
import { History, Plus } from '@lucide/vue'
defineProps<{ primaryColor: string }>()
defineEmits<{ (e: 'open-add'): void }>()
</script>
<template>
  <section class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p class="text-[11px] font-extrabold uppercase tracking-[0.18em]" :style="{ color: primaryColor }">YANGIN SÖNDÜRME SİSTEMLERİ</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-[#14284f] dark:text-white sm:text-[30px]">Yangın Tesisatı Durumu</h1>
      <p class="mt-1 text-sm text-slate-500">Son periyodik kontrol raporuna göre tesisatın genel durumu ve sistem bazlı sonuçları.</p>
    </div>
    <div class="flex items-center gap-2">
      <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#14284f] shadow-sm transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white" @click="$emit('open-add')"><Plus :size="17" />Sistem Ekle</button>
      <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#14284f] shadow-sm transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><History :size="17" />Rapor Geçmişi</NuxtLink>
    </div>
  </section>
</template>
