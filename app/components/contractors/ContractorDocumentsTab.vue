<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserRound, Truck, Wrench, FlaskConical, Check, X, FileText, MapPin } from 'lucide-vue-next'
import TurkeyDistributionMap from './visits/TurkeyDistributionMap.vue'

type Asset = { name: string; detail: string; documents: Record<string, boolean>; city?: string }
type LocationSummary = { name: string; personnel: number; vehicles: number; equipment: number; chemicals: number }

const activeType = ref<'personnel' | 'vehicles' | 'equipment' | 'chemicals' | 'locations'>('personnel')
const types = [
  { key: 'personnel' as const, label: 'Personeller', icon: UserRound },
  { key: 'vehicles' as const, label: 'Araçlar', icon: Truck },
  { key: 'equipment' as const, label: 'Ekipmanlar', icon: Wrench },
  { key: 'chemicals' as const, label: 'Kimyasallar', icon: FlaskConical },
  { key: 'locations' as const, label: 'Lokasyonlar', icon: MapPin },
]

const data: Record<string, Asset[]> = {
  personnel: [
    { name: 'Ahmet Yılmaz', detail: 'Teknik Personel', city: 'İstanbul', documents: { 'Kimlik': true, 'SGK': true, 'İSG Eğitimi': true, 'Sağlık Raporu': true } },
    { name: 'Mehmet Kaya', detail: 'Teknik Personel', city: 'Kocaeli', documents: { 'Kimlik': true, 'SGK': true, 'İSG Eğitimi': false, 'Sağlık Raporu': true } },
    { name: 'Burak Demir', detail: 'Usta', city: 'İstanbul', documents: { 'Kimlik': true, 'SGK': true, 'İSG Eğitimi': true, 'Sağlık Raporu': false } },
  ],
  vehicles: [
    { name: '34 ABC 123', detail: 'Servis Aracı', city: 'İstanbul', documents: { 'Ruhsat': true, 'Sigorta': true, 'Muayene': true, 'Kasko': false } },
    { name: '34 XYZ 456', detail: 'Kamyonet', city: 'Kocaeli', documents: { 'Ruhsat': true, 'Sigorta': true, 'Muayene': false, 'Kasko': true } },
  ],
  equipment: [
    { name: 'Akülü Matkap', detail: 'Bosch GSB 18V', city: 'İstanbul', documents: { 'CE Belgesi': true, 'Periyodik Kontrol': true, 'Kalibrasyon': false } },
    { name: 'Forklift', detail: 'Toyota 8FG25', city: 'Kocaeli', documents: { 'CE Belgesi': true, 'Periyodik Kontrol': true, 'Kalibrasyon': true } },
    { name: 'Kaynak Makinesi', detail: 'MIG/MAG', city: 'Ankara', documents: { 'CE Belgesi': false, 'Periyodik Kontrol': true, 'Kalibrasyon': true } },
  ],
  chemicals: [
    { name: 'Endüstriyel Temizleyici', detail: '5 L', city: 'İstanbul', documents: { 'GBF / SDS': true, 'Etiket': true, 'Risk Değerlendirmesi': true } },
    { name: 'Yağ Çözücü', detail: '20 L', city: 'Kocaeli', documents: { 'GBF / SDS': true, 'Etiket': false, 'Risk Değerlendirmesi': true } },
  ],
}

const locationSummaries: LocationSummary[] = [
  { name: 'Beylikdüzü Kampüsü', personnel: 100, vehicles: 92, equipment: 96, chemicals: 88 },
  { name: 'Sütlüce Kampüsü', personnel: 94, vehicles: 100, equipment: 91, chemicals: 100 },
  { name: 'Çayırova Fabrikası', personnel: 82, vehicles: 86, equipment: 78, chemicals: 91 },
]

const activeItems = computed(() => data[activeType.value] ?? [])
const documentNames = computed(() => [...new Set(activeItems.value.flatMap(item => Object.keys(item.documents)))])
const distributionTitle = computed(() => types.find(type => type.key === activeType.value)?.label ?? '')
const distributions = computed(() => {
  const counts = new Map<string, number>()
  activeItems.value.forEach(item => counts.set(item.city ?? 'İstanbul', (counts.get(item.city ?? 'İstanbul') ?? 0) + 1))
  return [...counts.entries()].map(([city, count]) => ({ city, count }))
})
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs">
    <div class="flex min-h-[520px] flex-col md:flex-row">
      <aside class="w-full shrink-0 border-b border-gray-100 bg-gray-50/50 p-3 md:w-52 md:border-b-0 md:border-r">
        <div class="px-3 py-2"><p class="text-xs font-semibold text-gray-900">Evrak Durumu</p><p class="mt-1 text-[11px] text-gray-500">Varlık ve personel belgeleri</p></div>
        <nav class="mt-3 space-y-1">
          <button v-for="type in types" :key="type.key" type="button" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors" :class="activeType===type.key?'bg-brand-50 text-brand-600':'text-gray-600 hover:bg-white hover:text-gray-900'" @click="activeType=type.key"><component :is="type.icon" :size="16" />{{ type.label }}</button>
        </nav>
      </aside>

      <div class="min-w-0 flex-1 p-6">
        <template v-if="activeType !== 'locations'">
          <div class="mb-5 flex items-center justify-between gap-4"><div><h2 class="text-sm font-semibold text-gray-900">{{ types.find(type => type.key === activeType)?.label }}</h2><p class="mt-1 text-xs text-gray-500">Kayıtlı varlıkların evrak durumlarını kontrol edin.</p></div><div class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500"><FileText :size="14" /> {{ activeItems.length }} kayıt</div></div>
          <TurkeyDistributionMap :title="distributionTitle" :distributions="distributions" :total="activeItems.length" />
          <div class="mt-5 overflow-x-auto rounded-xl border border-gray-100"><table class="w-full min-w-[760px] text-left"><thead><tr class="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500"><th class="px-4 py-3 font-medium">Kayıt</th><th class="px-4 py-3 font-medium">Lokasyon</th><th class="px-4 py-3 text-center font-medium">Evrak Durumu</th></tr></thead><tbody><tr v-for="item in activeItems" :key="item.name" class="border-b border-gray-100 last:border-0"><td class="px-4 py-4"><p class="text-sm font-medium text-gray-800">{{ item.name }}</p><p class="mt-1 text-[11px] text-gray-400">{{ item.detail }}</p></td><td class="px-4 py-4 text-xs text-gray-600">{{ item.city }}</td><td class="px-4 py-4 text-center"><span v-if="Object.values(item.documents).every(Boolean)" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-success-50 text-success-600" title="Tam"><Check :size="15" /></span><span v-else class="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-error-50 text-error-500" title="Eksik"><X :size="15" /></span></td></tr></tbody></table></div>
          <div class="mt-4 flex items-center gap-4 text-[11px] text-gray-400"><span class="flex items-center gap-1.5"><span class="flex h-5 w-5 items-center justify-center rounded-full bg-success-50 text-success-600"><Check :size="12" /></span> Tam</span><span class="flex items-center gap-1.5"><span class="flex h-5 w-5 items-center justify-center rounded-full bg-error-50 text-error-500"><X :size="12" /></span> Eksik</span></div>
        </template>

        <template v-else>
          <div class="mb-5 flex items-center justify-between gap-4"><div><h2 class="text-sm font-semibold text-gray-900">Lokasyon Bazlı Evrak Durumu</h2><p class="mt-1 text-xs text-gray-500">Her lokasyondaki personel, araç, ekipman ve kimyasalların genel evrak uygunluğu.</p></div><div class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500"><MapPin :size="14" /> {{ locationSummaries.length }} lokasyon</div></div>
          <div class="space-y-3"><div v-for="location in locationSummaries" :key="location.name" class="rounded-xl border border-gray-100 bg-gray-50/40 p-4"><div class="mb-4 flex items-center gap-3"><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><MapPin :size="16" /></div><div><p class="text-sm font-semibold text-gray-800">{{ location.name }}</p><p class="mt-0.5 text-[11px] text-gray-400">Genel evrak uygunluk durumu</p></div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><div v-for="item in [{label:'Personel',value:location.personnel},{label:'Araç',value:location.vehicles},{label:'Ekipman',value:location.equipment},{label:'Kimyasal',value:location.chemicals}]" :key="item.label"><div class="mb-1.5 flex items-center justify-between gap-2 text-[11px]"><span class="font-medium text-gray-600">{{ item.label }}</span><span class="font-semibold" :class="item.value===100?'text-success-600':item.value>=90?'text-brand-600':'text-warning-600'">{{ item.value }}%</span></div><div class="h-2 overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full transition-all" :class="item.value===100?'bg-success-500':item.value>=90?'bg-brand-500':'bg-warning-500'" :style="{ width: `${item.value}%` }"></div></div></div></div></div></div>
        </template>
      </div>
    </div>
  </section>
</template>