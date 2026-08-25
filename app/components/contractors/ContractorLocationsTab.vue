<script setup lang="ts">
import { MapPin, Users, Building2 } from 'lucide-vue-next'
defineProps<{ locations: Array<{ name: string; business: string; status: string }> }>()
const serviceSummary = { locationCount: 3, personnelCount: 48 }
const mapPoints = [
  { city: 'İstanbul', x: 16.5, y: 27, count: 2 },
  { city: 'Kocaeli', x: 20.5, y: 30, count: 1 },
  { city: 'Ankara', x: 48.5, y: 43, count: 1 },
  { city: 'İzmir', x: 17, y: 56, count: 1 },
]
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-5"><h2 class="text-sm font-semibold text-gray-900">Lokasyonlar</h2><p class="mt-1 text-xs text-gray-500">Daimi alt yüklenicinin lokasyon bazındaki ilişkileri.</p></div>
  <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
    <div class="relative overflow-hidden rounded-xl border border-gray-100 bg-slate-50/70 p-4">
      <div class="mb-2 flex items-center justify-between"><div><p class="text-xs font-semibold text-gray-800">Türkiye Operasyon Haritası</p><p class="mt-1 text-[11px] text-gray-500">Hizmet verilen lokasyonlar</p></div><span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 shadow-sm">{{ serviceSummary.locationCount }} lokasyon</span></div>
      <div class="relative mx-auto mt-2 aspect-[1005/490] max-w-[680px]">
        <img src="https://raw.githubusercontent.com/ali-han/Turkey-SVG-Map/main/src/turkey.svg" alt="Türkiye haritası" class="absolute inset-0 h-full w-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.08)]" loading="lazy" />
        <div v-for="point in mapPoints" :key="point.city" class="absolute -translate-x-1/2 -translate-y-1/2 text-center" :style="{ left: `${point.x}%`, top: `${point.y}%` }">
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-50 text-[10px] font-bold text-brand-600 shadow-sm"><span>{{ point.count }}</span></div>
          <span class="mt-0.5 block whitespace-nowrap text-[10px] font-medium text-gray-600">{{ point.city }}</span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><MapPin :size="19"/></div><div><p class="text-xs text-gray-500">Hizmet Verilen Lokasyon</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ serviceSummary.locationCount }}</p></div></div><p class="mt-3 text-xs leading-5 text-gray-500">Türkiye genelinde aktif ve geçmiş lokasyon ilişkileri.</p></div>
      <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600"><Users :size="19"/></div><div><p class="text-xs text-gray-500">Hizmet Veren Personel</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ serviceSummary.personnelCount }}</p></div></div><p class="mt-3 text-xs leading-5 text-gray-500">Bu lokasyonlarda görev yapan toplam personel.</p></div>
      <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600"><Building2 :size="19"/></div><div><p class="text-xs text-gray-500">Hizmet Verilen Organizasyon</p><p class="mt-1 text-2xl font-semibold text-gray-900">3</p></div></div><p class="mt-3 text-xs leading-5 text-gray-500">Farklı organizasyonlara bağlı lokasyonlarda hizmet.</p></div>
    </div>
  </div>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><div v-for="item in locations" :key="item.name" class="rounded-xl border border-gray-100 p-5"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-medium text-gray-800">{{ item.name }}</p><p class="mt-1 text-xs text-gray-500">{{ item.business }}</p></div><MapPin :size="17" class="text-gray-400"/></div><span class="mt-4 inline-block rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-medium text-success-600">{{ item.status }}</span></div></div>
</section>
</template>