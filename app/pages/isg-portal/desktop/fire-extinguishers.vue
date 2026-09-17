<script setup lang="ts">
import { CalendarDays, CheckCircle2, ChevronRight, Download, Eye, Flame, Pencil, Plus, QrCode, Search, ShieldCheck, SlidersHorizontal, Wrench } from '@lucide/vue'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import { emergencyEquipmentTypeApi } from '~/api/emergency-equipment-type'
import type { EmergencyEquipmentType } from '~/types/emergency-equipment'
import type { LocationEmergencyEquipmentItem, LocationEmergencyEquipmentPeriodicStatus } from '~/types/location-emergency-equipment'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: 'isg-portal' })

const context = useIsgDesktopContextStore()
const activeTab = ref<'overview' | 'monthly' | 'annual' | 'fill' | 'history'>('overview')
const search = ref('')
const statusFilter = ref('')
const items = ref<LocationEmergencyEquipmentItem[]>([])
const types = ref<EmergencyEquipmentType[]>([])
const loading = ref(false)
const selected = ref<LocationEmergencyEquipmentItem | null>(null)

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const [itemsRes, typesRes] = await Promise.all([
      locationEmergencyEquipmentApi.list(context.branchId),
      types.value.length ? Promise.resolve({ data: types.value }) : emergencyEquipmentTypeApi.list(),
    ])
    items.value = itemsRes.data
    types.value = typesRes.data
    if (!selected.value || !items.value.some(i => i.id === selected.value?.id)) selected.value = items.value[0] ?? null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
    return
  }
  load()
})
watch(() => context.branchId, load)

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—'
const daysUntil = (value?: string | null) => value ? Math.ceil((new Date(value).getTime() - Date.now()) / 86400000) : null

const monthlyStatus = (item: LocationEmergencyEquipmentItem): LocationEmergencyEquipmentPeriodicStatus | null => {
  const freq = item.equipment_type?.inspection_frequency_days
  const base = item.latest_inspection?.inspected_at ?? item.install_date
  if (!freq || !base) return null
  const next = new Date(base)
  next.setDate(next.getDate() + freq)
  const now = new Date()
  const in30 = new Date(now)
  in30.setDate(now.getDate() + 30)
  if (next < now) return 'gecikmis'
  if (next <= in30) return 'yaklasiyor'
  return 'guncel'
}

const periodicMeta = (status: LocationEmergencyEquipmentPeriodicStatus | null) => ({
  gecikmis: { label: 'Gecikmiş', cls: 'bg-red-50 text-red-700' },
  yaklasiyor: { label: 'Yaklaşıyor', cls: 'bg-orange-50 text-orange-700' },
  guncel: { label: 'Güncel', cls: 'bg-emerald-50 text-emerald-700' },
}[status ?? ''] ?? { label: 'Kontrol Yok', cls: 'bg-gray-100 text-gray-500' })

const annualPending = computed(() => items.value.filter(i => ['gecikmis', 'yaklasiyor'].includes(i.annual_control_status ?? '')).length)
const fillPending = computed(() => items.value.filter(i => ['gecikmis', 'yaklasiyor'].includes(i.fill_status ?? '')).length)
const monthlyPending = computed(() => items.value.filter(i => ['gecikmis', 'yaklasiyor'].includes(monthlyStatus(i) ?? '')).length)
const activeCount = computed(() => items.value.filter(i => i.is_active).length)

const rowStatus = (item: LocationEmergencyEquipmentItem) => {
  const monthly = monthlyStatus(item)
  if (item.fill_status === 'gecikmis' || item.fill_status === 'yaklasiyor') return '4 Yıllık Dolum'
  if (item.annual_control_status === 'gecikmis' || item.annual_control_status === 'yaklasiyor') return 'Yıllık Bakım'
  if (monthly === 'gecikmis' || monthly === 'yaklasiyor') return 'Aylık Kontrol'
  return item.is_active ? 'Aktif' : 'Pasif'
}

const rowStatusClass = (item: LocationEmergencyEquipmentItem) => ({
  'Aktif': 'bg-emerald-50 text-emerald-700',
  'Aylık Kontrol': 'bg-orange-50 text-orange-700',
  'Yıllık Bakım': 'bg-red-50 text-red-700',
  '4 Yıllık Dolum': 'bg-violet-50 text-violet-700',
  'Pasif': 'bg-gray-100 text-gray-600',
}[rowStatus(item)] || 'bg-gray-100 text-gray-600')

const filteredItems = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr-TR')
  return items.value.filter(item => {
    if (q && !`${item.code ?? ''} ${item.location_note ?? ''} ${item.equipment_type?.tip ?? ''} ${item.equipment_type?.name ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false
    if (statusFilter.value && rowStatus(item) !== statusFilter.value) return false
    if (activeTab.value === 'monthly' && !['gecikmis', 'yaklasiyor'].includes(monthlyStatus(item) ?? '')) return false
    if (activeTab.value === 'annual' && !['gecikmis', 'yaklasiyor'].includes(item.annual_control_status ?? '')) return false
    if (activeTab.value === 'fill' && !['gecikmis', 'yaklasiyor'].includes(item.fill_status ?? '')) return false
    return true
  })
})

const selectItem = (item: LocationEmergencyEquipmentItem) => { selected.value = item }
const equipmentLabel = (item: LocationEmergencyEquipmentItem) => item.equipment_type?.capacity_kg ? `${item.equipment_type?.tip || item.equipment_type?.name || 'YSC'} / ${item.equipment_type.capacity_kg} kg` : item.equipment_type?.tip || item.equipment_type?.name || 'Yangın Söndürücü'
const nextDate = (item: LocationEmergencyEquipmentItem) => item.next_annual_maintenance_date || item.next_fill_date || item.latest_inspection?.inspected_at
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] bg-[#f6f8fb] text-[#12204b]">
    <main class="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <div class="mb-1 text-[12px] font-semibold text-[#1b4297]">Olivium Burger <span class="mx-2 text-gray-300">›</span> Yangın Yönetimi <span class="mx-2 text-gray-300">›</span> Yangın Söndürücüler (YSC)</div>
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"><img src="/images/fire-extinguisher.svg" class="h-11 w-8 object-contain" alt="Yangın söndürücü" /></div>
            <div><h1 class="text-[28px] font-extrabold tracking-[-.03em]">Yangın Söndürücüler (YSC)</h1><p class="text-sm text-[#64748b]">Şubedeki yangın söndürücülerin kontrol, bakım ve dolum süreçlerini yönetin.</p></div>
          </div>
        </div>
        <button class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#e30613] px-5 text-sm font-bold text-white shadow-lg shadow-red-100"><Plus :size="18" /> Yeni YSC Ekle</button>
      </div>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-xl border border-blue-100 bg-[#f0f7ff] p-4"><div class="flex items-center gap-3"><img src="/images/fire-extinguisher.svg" class="h-12 w-9 object-contain" /><div><div class="text-xs font-semibold text-[#64748b]">Toplam YSC</div><div class="mt-1 text-[27px] font-extrabold">{{ items.length }}</div><div class="text-[11px] text-[#64748b]">Bu şubedeki söndürücüler</div></div></div></div>
        <div class="rounded-xl border border-emerald-100 bg-[#effcf7] p-4"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CheckCircle2 class="text-emerald-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Aktif</div><div class="mt-1 text-[27px] font-extrabold">{{ activeCount }}</div><div class="text-[11px] text-[#64748b]">Kullanıma hazır</div></div></div></div>
        <div class="rounded-xl border border-orange-100 bg-[#fff8ed] p-4"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CalendarDays class="text-orange-500" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Aylık Kontrol Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ monthlyPending }}</div><div class="text-[11px] text-[#64748b]">Yaklaşan veya geciken</div></div></div></div>
        <div class="rounded-xl border border-red-100 bg-[#fff1f2] p-4"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><ShieldCheck class="text-red-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Yıllık Bakım Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ annualPending }}</div><div class="text-[11px] text-[#64748b]">Akredite bakım süreci</div></div></div></div>
        <div class="rounded-xl border border-violet-100 bg-[#f7f2ff] p-4"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><Wrench class="text-violet-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">4 Yıllık Dolum Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ fillPending }}</div><div class="text-[11px] text-[#64748b]">Dolum zamanı gelen</div></div></div></div>
      </section>

      <div class="mt-4 flex overflow-x-auto rounded-xl border border-[#e5e9ef] bg-white">
        <button v-for="tab in [{id:'overview',label:'Genel Bakış'},{id:'monthly',label:'Aylık Kontroller'},{id:'annual',label:'Yıllık Bakımlar'},{id:'fill',label:'4 Yıllık Dolumlar'},{id:'history',label:'Kontrol Geçmişi'}]" :key="tab.id" @click="activeTab = tab.id as typeof activeTab" :class="['min-w-[165px] border-r border-[#edf0f3] px-5 py-3 text-sm font-semibold last:border-0', activeTab === tab.id ? 'bg-[#e30613] text-white' : 'text-[#1d376e] hover:bg-gray-50']">{{ tab.label }}</button>
      </div>

      <section class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div class="overflow-hidden rounded-xl border border-[#e5e9ef] bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 xl:flex-row xl:items-center">
            <div class="relative flex-1"><Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#d71920]" /><input v-model="search" class="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-[#d71920]" placeholder="YSC kodu, konum veya tip ara..." /></div>
            <select v-model="statusFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm"><option value="">Tüm Durumlar</option><option>Aktif</option><option>Aylık Kontrol</option><option>Yıllık Bakım</option><option>4 Yıllık Dolum</option><option>Pasif</option></select>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold"><SlidersHorizontal :size="15" class="mr-2 inline" />Filtrele</button>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold"><Download :size="15" class="mr-2 inline" />Excel'e Aktar</button>
          </div>
          <div v-if="loading" class="p-12 text-center text-sm text-gray-500">YSC kayıtları yükleniyor...</div>
          <div v-else-if="!filteredItems.length" class="p-12 text-center text-sm text-gray-500">Bu filtreye uygun YSC bulunamadı.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-[1050px] w-full text-left">
              <thead><tr class="bg-[#f8fafc] text-[11px] font-bold text-[#64748b]"><th class="px-4 py-3">Fotoğraf</th><th class="px-3 py-3">YSC Kodu</th><th class="px-3 py-3">Tip / Kapasite</th><th class="px-3 py-3">Konum</th><th class="px-3 py-3">Son Kontrol</th><th class="px-3 py-3">Sonraki İşlem</th><th class="px-3 py-3">Durum</th><th class="px-3 py-3">İşlemler</th></tr></thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id" class="cursor-pointer border-t border-[#edf0f3] hover:bg-[#fffafa]" @click="selectItem(item)">
                  <td class="px-4 py-2"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50"><img src="/images/fire-extinguisher.svg" class="h-11 w-8 object-contain" alt="YSC" /></div></td>
                  <td class="px-3 py-3 text-sm font-bold text-[#17367d]">{{ item.code || `YSC-${item.id}` }}</td>
                  <td class="px-3 py-3 text-xs font-medium">{{ equipmentLabel(item) }}</td>
                  <td class="px-3 py-3 text-xs">{{ item.location_note || '—' }}</td>
                  <td class="px-3 py-3 text-xs">{{ formatDate(item.latest_inspection?.inspected_at) }}</td>
                  <td class="px-3 py-3 text-xs font-semibold">{{ formatDate(nextDate(item)) }}</td>
                  <td class="px-3 py-3"><span :class="['rounded-md px-2.5 py-1 text-[10px] font-bold', rowStatusClass(item)]">{{ rowStatus(item) }}</span></td>
                  <td class="px-3 py-3"><button class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"><Eye :size="15" /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex items-center justify-between border-t border-[#edf0f3] px-4 py-3 text-xs text-[#64748b]"><span>{{ filteredItems.length }} kayıt gösteriliyor. Toplam {{ items.length }} kayıt.</span><span class="rounded-lg bg-gray-50 px-3 py-2">Canlı API verisi</span></div>
        </div>

        <aside class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div class="flex items-center justify-between"><h3 class="text-lg font-bold">{{ selected?.code || 'YSC Detayı' }}</h3><span v-if="selected" class="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">● {{ selected.is_active ? 'Aktif' : 'Pasif' }}</span></div>
          <template v-if="selected">
            <div class="mt-4 flex items-center justify-between rounded-xl bg-[#fbfbfc] p-3"><img src="/images/fire-extinguisher.svg" class="h-32 w-24 object-contain" alt="Yangın söndürücü" /><div class="text-right"><div class="text-2xl font-extrabold">{{ selected.code || `YSC-${selected.id}` }}</div><div class="mt-1 text-xs text-gray-500">{{ selected.equipment_type?.name || 'Yangın Söndürücü' }}</div></div></div>
            <div class="mt-3 flex flex-col items-center rounded-xl bg-gray-50 py-4"><div class="flex h-28 w-28 items-center justify-center rounded-xl bg-white shadow-sm"><QrCode :size="82" /></div><div class="mt-2 text-xs font-bold">{{ selected.code || `YSC-${selected.id}` }}</div></div>
            <dl class="mt-4 space-y-2 text-xs"><div class="flex justify-between gap-3"><dt class="text-gray-500">Tip / Kapasite</dt><dd class="text-right font-semibold">{{ equipmentLabel(selected) }}</dd></div><div class="flex justify-between gap-3"><dt class="text-gray-500">Konum</dt><dd class="max-w-[160px] text-right font-semibold">{{ selected.location_note || '—' }}</dd></div><div class="flex justify-between gap-3"><dt class="text-gray-500">Son Kontrol</dt><dd class="font-semibold">{{ formatDate(selected.latest_inspection?.inspected_at) }}</dd></div><div class="flex justify-between gap-3"><dt class="text-gray-500">Sonraki İşlem</dt><dd class="font-semibold" :class="daysUntil(nextDate(selected)) !== null && daysUntil(nextDate(selected))! < 0 ? 'text-red-600' : 'text-[#12204b]'">{{ formatDate(nextDate(selected)) }}</dd></div><div class="flex justify-between gap-3"><dt class="text-gray-500">Yıllık Bakım</dt><dd class="font-semibold">{{ periodicMeta(selected.annual_control_status ?? null).label }}</dd></div><div class="flex justify-between gap-3"><dt class="text-gray-500">4 Yıllık Dolum</dt><dd class="font-semibold">{{ periodicMeta(selected.fill_status ?? null).label }}</dd></div></dl>
            <div class="mt-4 grid grid-cols-2 gap-2"><button class="rounded-lg border border-gray-200 py-2 text-xs font-bold"><Pencil :size="14" class="mr-1 inline" />Düzenle</button><button class="rounded-lg border border-gray-200 py-2 text-xs font-bold"><CalendarDays :size="14" class="mr-1 inline" />Kontrol Ekle</button></div>
            <button class="mt-3 w-full rounded-lg bg-[#e30613] py-3 text-sm font-bold text-white">Detayları Görüntüle <ChevronRight :size="17" class="ml-1 inline" /></button>
          </template>
          <div v-else class="py-10 text-center text-sm text-gray-500">Henüz YSC kaydı bulunmuyor.</div>
        </aside>
      </section>

      <div class="mt-4 flex items-center gap-4 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#e30613] text-white"><Flame :size="25" /></div><div><div class="text-lg font-extrabold text-[#e30613]">Yangın güvenliği, güvenli lezzet demektir.</div><div class="text-sm text-[#64748b]">Düzenli kontrol, güvenli yarınlar. Olivium Burger.</div></div></div>
    </main>
  </div>
</template>