<script setup lang="ts">
import { MapPin, Users, Building2 } from 'lucide-vue-next'
defineProps<{ locations: Array<{ name: string; business: string; status: string }> }>()
const serviceSummary = { locationCount: 3, personnelCount: 48 }
const mapPoints = [
  { city: 'İstanbul', x: 24, y: 30, count: 2 },
  { city: 'Kocaeli', x: 31, y: 34, count: 1 },
  { city: 'Ankara', x: 54, y: 46, count: 1 },
  { city: 'İzmir', x: 23, y: 63, count: 1 },
]
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-5"><h2 class="text-sm font-semibold text-gray-900">Lokasyonlar</h2><p class="mt-1 text-xs text-gray-500">Daimi alt yüklenicinin lokasyon bazındaki ilişkileri.</p></div>
  <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
    <div class="relative overflow-hidden rounded-xl border border-gray-100 bg-slate-50/70 p-4">
      <div class="mb-2 flex items-center justify-between"><div><p class="text-xs font-semibold text-gray-800">Türkiye Operasyon Haritası</p><p class="mt-1 text-[11px] text-gray-500">Hizmet verilen lokasyonlar</p></div><span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 shadow-sm">{{ serviceSummary.locationCount }} lokasyon</span></div>
      <div class="relative mx-auto mt-2 aspect-[1.85/1] max-w-[680px]">
        <svg viewBox="0 0 760 410" class="h-full w-full" aria-label="Türkiye haritası" role="img">
          <defs><filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity=".12"/></filter></defs>
          <!-- Stylized Turkey silhouette: recognizable long east-west Anatolian peninsula -->
          <path d="M55 145 L76 129 L101 126 L119 111 L147 116 L168 103 L198 106 L221 95 L252 102 L278 91 L309 99 L337 91 L368 101 L397 96 L427 107 L458 101 L486 111 L516 106 L546 120 L576 116 L605 128 L633 132 L660 149 L696 155 L710 169 L696 182 L705 196 L687 207 L674 222 L649 226 L631 241 L607 239 L586 252 L561 248 L542 262 L517 259 L495 273 L469 268 L449 282 L423 277 L398 289 L371 283 L347 296 L322 287 L296 298 L271 289 L246 298 L221 287 L195 292 L172 279 L146 282 L128 266 L105 265 L92 248 L75 243 L80 224 L66 211 L72 194 L57 181 L66 166 Z" class="fill-white text-white" stroke="currentColor" stroke-width="3" filter="url(#mapShadow)"/>
          <path d="M95 171 C165 149 231 157 292 137 C361 115 425 139 486 128 C548 117 606 141 675 158" fill="none" class="text-gray-200" stroke="currentColor" stroke-width="2" stroke-dasharray="5 7"/>
          <g v-for="point in mapPoints" :key="point.city" :transform="`translate(${point.x*7.4},${point.y*4.1})`">
            <circle r="15" class="fill-brand-100 stroke-brand-500" stroke-width="2"/><circle r="5" class="fill-brand-500"/><text y="28" text-anchor="middle" class="fill-gray-600 text-[12px] font-medium">{{ point.city }}</text><text y="4" text-anchor="middle" class="fill-white text-[9px] font-bold">{{ point.count }}</text>
          </g>
        </svg>
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