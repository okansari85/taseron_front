<script setup lang="ts">
import { MapPin, Users, Building2 } from 'lucide-vue-next'
defineProps<{ locations: Array<{ name: string; business: string; status: string }> }>()
const serviceSummary = { locationCount: 3, personnelCount: 48 }
const mapPoints = [
  { city: 'İstanbul', x: 30, y: 34, count: 2 },
  { city: 'Kocaeli', x: 39, y: 39, count: 1 },
  { city: 'Ankara', x: 58, y: 48, count: 1 },
  { city: 'İzmir', x: 22, y: 59, count: 1 },
]
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-5"><h2 class="text-sm font-semibold text-gray-900">Lokasyonlar</h2><p class="mt-1 text-xs text-gray-500">Daimi alt yüklenicinin lokasyon bazındaki ilişkileri.</p></div>
  <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
    <div class="relative overflow-hidden rounded-xl border border-gray-100 bg-slate-50/70 p-4">
      <div class="mb-2 flex items-center justify-between"><div><p class="text-xs font-semibold text-gray-800">Türkiye Operasyon Haritası</p><p class="mt-1 text-[11px] text-gray-500">Hizmet verilen lokasyonlar</p></div><span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 shadow-sm">{{ serviceSummary.locationCount }} lokasyon</span></div>
      <div class="relative mx-auto mt-2 aspect-[1.7/1] max-w-[680px]">
        <svg viewBox="0 0 700 410" class="h-full w-full" aria-label="Türkiye lokasyon haritası" role="img">
          <path d="M64 135 C88 116 113 121 132 106 C154 88 180 101 199 91 C224 77 247 93 268 87 C292 80 312 96 334 91 C356 86 375 101 398 94 C421 87 445 101 468 96 C494 90 516 104 538 99 C565 93 592 112 617 121 C640 129 650 148 636 162 C624 176 635 192 619 204 C604 216 608 236 588 245 C568 254 560 271 539 278 C518 285 504 303 480 299 C455 295 442 315 418 308 C395 301 380 320 355 312 C330 304 312 321 287 312 C263 303 244 316 221 307 C198 298 181 310 160 297 C139 284 118 287 105 271 C92 255 74 248 79 228 C84 208 67 194 73 176 C78 160 55 151 64 135 Z" fill="currentColor" class="text-white" stroke="currentColor" stroke-width="3" />
          <path d="M107 180 C155 157 201 166 248 151 C302 133 346 145 396 137 C447 129 492 145 548 140 C584 137 606 153 619 169" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 7" class="text-gray-200" />
          <g v-for="point in mapPoints" :key="point.city" :transform="`translate(${point.x*10},${point.y*6.1})`">
            <circle r="14" class="fill-brand-100 stroke-brand-500" stroke-width="2"/><circle r="5" class="fill-brand-500"/><text y="28" text-anchor="middle" class="fill-gray-600 text-[12px] font-medium">{{ point.city }}</text><text y="4" text-anchor="middle" class="fill-white text-[9px] font-bold">{{ point.count }}</text>
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