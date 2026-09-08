<script setup lang="ts">
import { MapPin, Users, Building2 } from 'lucide-vue-next'

type LocationItem = { name: string; business: string; status: string; city: string; brands: string[] }
const props = defineProps<{ locations: LocationItem[] }>()

// Şehir adı -> Türkiye haritası üzerinde yaklaşık yüzde konumu (yalnızca bilinen şehirler çizilir,
// bilinmeyen bir şehir için uydurma bir nokta koymak yerine sadece özet sayılara dahil edilir).
const cityCoordinates: Record<string, { x: number; y: number }> = {
  'İstanbul': { x: 16.5, y: 27 },
  'Kocaeli': { x: 20.5, y: 30 },
  'Ankara': { x: 48.5, y: 43 },
  'İzmir': { x: 17, y: 56 },
  'Bursa': { x: 22, y: 33 },
  'Antalya': { x: 33, y: 68 },
  'Adana': { x: 62, y: 62 },
  'Mersin': { x: 55, y: 66 },
  'Muğla': { x: 22, y: 70 },
}

const serviceSummary = computed(() => ({
  locationCount: props.locations.length,
  organizationCount: new Set(props.locations.map((x) => x.business)).size,
  brandCount: new Set(props.locations.flatMap((x) => x.brands ?? [])).size,
}))

const mapPoints = computed(() => {
  const counts = new Map<string, number>()
  for (const item of props.locations) {
    if (!item.city) continue
    counts.set(item.city, (counts.get(item.city) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .filter(([city]) => cityCoordinates[city])
    .map(([city, count]) => ({ city, count, ...cityCoordinates[city] }))
})
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-5"><h2 class="text-sm font-semibold text-gray-900">Lokasyonlar</h2><p class="mt-1 text-xs text-gray-500">Alt yüklenicinin bağlı olduğu organizasyonlar altındaki gerçek şube (lokasyon) kayıtları.</p></div>
  <div v-if="!locations.length" class="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
    Bu alt yüklenici henüz hiçbir organizasyona bağlı değil, bu yüzden gösterilecek lokasyon yok. Organizasyon eşleştirmesi yapıldığında bu sekme otomatik dolar.
  </div>
  <template v-else>
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
      <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><MapPin :size="19"/></div><div><p class="text-xs text-gray-500">Hizmet Verilen Lokasyon</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ serviceSummary.locationCount }}</p></div></div><p class="mt-3 text-xs leading-5 text-gray-500">Bağlı organizasyonlar altındaki toplam şube sayısı.</p></div>
      <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600"><Building2 :size="19"/></div><div><p class="text-xs text-gray-500">Hizmet Verilen Firma</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ serviceSummary.organizationCount }}</p></div></div><p class="mt-3 text-xs leading-5 text-gray-500">Farklı şirket/marka sahibi işletmelere bağlı lokasyonlar.</p></div>
      <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600"><Users :size="19"/></div><div><p class="text-xs text-gray-500">Marka Sayısı</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ serviceSummary.brandCount }}</p></div></div><p class="mt-3 text-xs leading-5 text-gray-500">Bu lokasyonlarda hizmet verilen farklı marka sayısı.</p></div>
    </div>
  </div>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><div v-for="(item, idx) in locations" :key="`${item.name}-${idx}`" class="rounded-xl border border-gray-100 p-5"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-medium text-gray-800">{{ item.name }}</p><p class="mt-1 text-xs text-gray-500">{{ item.business }}<template v-if="item.city"> · {{ item.city }}</template></p></div><MapPin :size="17" class="text-gray-400"/></div><span class="mt-4 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium" :class="item.status==='Aktif' ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'">{{ item.status }}</span></div></div>
  </template>
</section>
</template>
