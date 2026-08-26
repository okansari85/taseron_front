<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserRound, Truck, Wrench, FlaskConical, Check, X, FileText, MapPin, Search, ChevronDown } from 'lucide-vue-next'

type Asset = { name: string; detail: string; documents: Record<string, boolean>; city?: string }
type LocationSummary = { name: string; personnel: number; vehicles: number; equipment: number; chemicals: number }

const activeType = ref<'personnel' | 'vehicles' | 'equipment' | 'chemicals' | 'locations'>('personnel')
const search = ref('')
const cityFilter = ref('')
const documentFilter = ref<'all' | 'complete' | 'missing'>('all')
const expandedRows = ref<Set<string>>(new Set())
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
const filteredItems = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr-TR')
  return activeItems.value.filter(item => {
    const matchesSearch = !q || `${item.name} ${item.detail} ${item.city ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)
    const matchesCity = !cityFilter.value || item.city === cityFilter.value
    const complete = Object.values(item.documents).every(Boolean)
    const matchesDocument = documentFilter.value === 'all' || (documentFilter.value === 'complete' ? complete : !complete)
    return matchesSearch && matchesCity && matchesDocument
  })
})
const cities = computed(() => [...new Set(activeItems.value.map(item => item.city).filter(Boolean))])
const totalCount = computed(() => activeItems.value.length)
const completeCount = computed(() => activeItems.value.filter(item => Object.values(item.documents).every(Boolean)).length)
const missingCount = computed(() => totalCount.value - completeCount.value)
const totalRate = computed(() => totalCount.value ? Math.round((completeCount.value / totalCount.value) * 100) : 0)
const distributions = computed(() => {
  const counts = new Map<string, number>()
  activeItems.value.forEach(item => counts.set(item.city ?? 'İstanbul', (counts.get(item.city ?? 'İstanbul') ?? 0) + 1))
  return [...counts.entries()].map(([city, count]) => ({ city, count }))
})
const clearFilters = () => { search.value = ''; cityFilter.value = ''; documentFilter.value = 'all' }
const rowKey = (item: Asset) => `${activeType.value}:${item.name}`
const toggleRow = (item: Asset) => {
  const key = rowKey(item)
  const next = new Set(expandedRows.value)
  next.has(key) ? next.delete(key) : next.add(key)
  expandedRows.value = next
}
const isExpanded = (item: Asset) => expandedRows.value.has(rowKey(item))
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
          <div class="mb-5 flex items-center justify-between gap-4"><div><h2 class="text-sm font-semibold text-gray-900">{{ types.find(type => type.key === activeType)?.label }}</h2><p class="mt-1 text-xs text-gray-500">Kayıtlı varlıkların evrak durumlarını kontrol edin.</p></div></div>
          <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><p class="text-xs text-gray-500">Toplam Kayıt</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ totalCount }}</p></div><div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><p class="text-xs text-gray-500">Evrakı Tam</p><p class="mt-1 text-2xl font-semibold text-success-600">{{ completeCount }}</p></div><div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><p class="text-xs text-gray-500">Eksik Evrak</p><p class="mt-1 text-2xl font-semibold text-error-500">{{ missingCount }}</p></div><div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><p class="text-xs text-gray-500">Toplam Oran</p><p class="mt-1 text-2xl font-semibold text-brand-600">%{{ totalRate }}</p></div></div>
          <div class="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-4"><div class="relative min-w-[220px] flex-1"><Search :size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input v-model="search" type="text" placeholder="Kayıtlarda ara..." class="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none focus:border-brand-300 focus:bg-white"/></div><select v-model="cityFilter" class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none focus:border-brand-300"><option value="">Tüm şehirler</option><option v-for="city in cities" :key="city" :value="city">{{ city }}</option></select><select v-model="documentFilter" class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none focus:border-brand-300"><option value="all">Tüm evrak durumları</option><option value="complete">Evrakı tam</option><option value="missing">Eksik evrak</option></select><button v-if="search || cityFilter || documentFilter !== 'all'" type="button" @click="clearFilters" class="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-500 hover:bg-gray-50">Temizle</button></div>
          <div class="overflow-x-auto rounded-xl border border-gray-100"><table class="w-full min-w-[760px] text-left"><thead><tr class="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500"><th class="w-10 px-3 py-3"></th><th class="px-4 py-3 font-medium">Kayıt</th><th class="px-4 py-3 font-medium">Lokasyon</th><th class="px-4 py-3 text-center font-medium">Evrak Durumu</th></tr></thead><tbody><template v-for="item in filteredItems" :key="item.name"><tr class="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50/60" @click="toggleRow(item)"><td class="px-3 py-4"><ChevronDown :size="16" class="text-gray-400 transition-transform" :class="isExpanded(item) ? 'rotate-180' : ''" /></td><td class="px-4 py-4"><p class="text-sm font-medium text-gray-800">{{ item.name }}</p><p class="mt-1 text-[11px] text-gray-400">{{ item.detail }}</p></td><td class="px-4 py-4 text-xs text-gray-600">{{ item.city }}</td><td class="px-4 py-4 text-center"><span v-if="Object.values(item.documents).every(Boolean)" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-success-50 text-success-600" title="Tam"><Check :size="15" /></span><span v-else class="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-error-50 text-error-500" title="Eksik"><X :size="15" /></span></td></tr><tr v-if="isExpanded(item)" class="border-b border-gray-100 bg-gray-50/40"><td></td><td colspan="3" class="px-4 pb-4 pt-2"><div class="rounded-lg border border-gray-100 bg-white p-3"><div class="mb-2 flex items-center gap-2"><FileText :size="14" class="text-gray-400"/><span class="text-xs font-semibold text-gray-700">Evrak Kontrolü</span></div><div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"> <div v-for="(isValid, documentName) in item.documents" :key="documentName" class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"><span class="text-xs text-gray-600">{{ documentName }}</span><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" :class="isValid ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-500'"><Check v-if="isValid" :size="13"/><X v-else :size="13"/></span></div></div></div></td></tr></template><tr v-if="!filteredItems.length"><td colspan="4" class="px-4 py-12 text-center text-xs text-gray-400">Filtrelere uygun kayıt bulunamadı.</td></tr></tbody></table></div>
          <div class="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500"><FileText :size="14" /> {{ filteredItems.length }} kayıt gösteriliyor<span v-if="distributions.length" class="ml-auto">{{ distributions.map(item => `${item.city} ${item.count}`).join(' · ') }}</span></div>
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