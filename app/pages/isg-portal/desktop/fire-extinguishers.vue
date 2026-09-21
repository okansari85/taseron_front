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
const pct = (part: number, total: number) => total ? Math.round((part / total) * 100) : 0
const overviewActivePct = computed(() => pct(activeCount.value, items.value.length))
const overviewMonthlyPendingPct = computed(() => pct(monthlyPending.value, items.value.length))
const overviewAnnualPendingPct = computed(() => pct(annualPending.value, items.value.length))
const overviewFillPendingPct = computed(() => pct(fillPending.value, items.value.length))

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
  const result = items.value.filter(item => {
    if (q && !`${item.code ?? ''} ${item.location_note ?? ''} ${item.equipment_type?.tip ?? ''} ${item.equipment_type?.name ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false
    if (statusFilter.value && rowStatus(item) !== statusFilter.value) return false
    if (activeTab.value === 'monthly' && !['gecikmis', 'yaklasiyor'].includes(monthlyStatus(item) ?? '')) return false
    if (activeTab.value === 'fill' && !['gecikmis', 'yaklasiyor'].includes(item.fill_status ?? '')) return false
    return true
  })

  // "Yıllık Bakımlar" tabı: hangi tüp NE ZAMAN bakılmış/bakılacak - bekleyen/
  // gecikmiş filtresi DEĞİL, hepsi görünür. Sadece sıralama değişir: geçenler
  // (en negatif kalan gün) en üstte, yaklaşanlar altta, kalan gün sayısına
  // göre artan sıra. Hiç yıllık kontrolü olmayan tüpler (kalan gün yok) en sona.
  if (activeTab.value === 'annual') {
    return [...result].sort((a, b) => {
      const da = daysUntil(a.next_annual_maintenance_date)
      const db = daysUntil(b.next_annual_maintenance_date)
      if (da === null && db === null) return 0
      if (da === null) return 1
      if (db === null) return -1
      return da - db
    })
  }

  return result
})

const selectItem = (item: LocationEmergencyEquipmentItem) => { selected.value = item }
const equipmentLabel = (item: LocationEmergencyEquipmentItem) => item.equipment_type?.capacity_kg ? `${item.equipment_type?.tip || item.equipment_type?.name || 'YSC'} / ${item.equipment_type.capacity_kg} kg` : item.equipment_type?.tip || item.equipment_type?.name || 'Yangın Söndürücü'
const nextDate = (item: LocationEmergencyEquipmentItem) => item.next_annual_maintenance_date || item.next_fill_date || item.latest_inspection?.inspected_at

// --- "Aylık Kontroller" tabı - kendi ay bazlı görünümü, diğer tabların
// paylaştığı jenerik tablo/detay panelinden AYRI (referans tasarıma göre:
// ay seçici, kendi filtreleri, tamamlanma donut'u, konum bazlı kırılım). ---
const monthlyMonth = ref(new Date())
const monthlySearch = ref('')
const monthlyStatusFilter = ref('')
const monthlyLocationFilter = ref('')
const monthlyPage = ref(1)
const monthlyPageSize = 10

const monthLabel = computed(() => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(monthlyMonth.value))
const shiftMonth = (delta: number) => {
  const d = new Date(monthlyMonth.value)
  d.setDate(1)
  d.setMonth(d.getMonth() + delta)
  monthlyMonth.value = d
  monthlyPage.value = 1
}

const isSameMonth = (dateStr: string | null | undefined, ref: Date) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

type MonthlyRowStatus = 'edildi' | 'bekliyor' | 'gecti'
// NOT: sadece EN SON kontrolü (latest_inspection) baz alır, tam geçmiş değil -
// seçili ay ile şu anki ay aynıysa (yaygın kullanım) doğru sonuç verir; geçmiş
// bir aya gidildiğinde o equipment'ın o AYA ait GERÇEK kontrolü değil, hâlâ en
// son kontrolü gösterilir (tam geçmiş için equipment başına inspections()
// listesi çekilmesi gerekir - kapsam dışı bırakıldı).
const monthlyRowStatus = (item: LocationEmergencyEquipmentItem): MonthlyRowStatus => {
  if (isSameMonth(item.latest_inspection?.inspected_at, monthlyMonth.value)) return 'edildi'
  const now = new Date()
  const isPastMonth = monthlyMonth.value.getFullYear() < now.getFullYear()
    || (monthlyMonth.value.getFullYear() === now.getFullYear() && monthlyMonth.value.getMonth() < now.getMonth())
  return isPastMonth ? 'gecti' : 'bekliyor'
}
const monthlyStatusMeta: Record<MonthlyRowStatus, { label: string; cls: string }> = {
  edildi: { label: 'Kontrol Edildi', cls: 'bg-emerald-50 text-emerald-700' },
  bekliyor: { label: 'Kontrol Bekliyor', cls: 'bg-amber-50 text-amber-700' },
  gecti: { label: 'Süresi Geçti', cls: 'bg-red-50 text-red-700' },
}

const monthlyLocations = computed(() => [...new Set(items.value.map(i => i.location_note).filter((v): v is string => !!v))].sort())

const monthlyFilteredItems = computed(() => {
  const q = monthlySearch.value.trim().toLocaleLowerCase('tr-TR')
  return items.value.filter((item) => {
    if (q && !`${item.code ?? ''} ${item.location_note ?? ''} ${item.equipment_type?.tip ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false
    if (monthlyLocationFilter.value && item.location_note !== monthlyLocationFilter.value) return false
    if (monthlyStatusFilter.value && monthlyRowStatus(item) !== monthlyStatusFilter.value) return false
    return true
  })
})

const monthlyStats = computed(() => {
  const all = items.value
  const edildi = all.filter(i => monthlyRowStatus(i) === 'edildi').length
  const gecti = all.filter(i => monthlyRowStatus(i) === 'gecti').length
  const total = all.length
  const bekliyor = total - edildi - gecti
  const pct = total ? Math.round((edildi / total) * 100) : 0
  return { edildi, bekliyor, gecti, total, pct }
})

// Donut: conic-gradient ile - segment sırası edildi (yeşil) / bekliyor
// (turuncu) / geçti (kırmızı), yüzdelere göre açı payı.
const monthlyDonutStyle = computed(() => {
  const { edildi, bekliyor, total } = monthlyStats.value
  if (!total) return { background: '#e5e7eb' }
  const edildiDeg = (edildi / total) * 360
  const bekliyorDeg = (bekliyor / total) * 360
  return {
    background: `conic-gradient(#10b981 0deg ${edildiDeg}deg, #f59e0b ${edildiDeg}deg ${edildiDeg + bekliyorDeg}deg, #ef4444 ${edildiDeg + bekliyorDeg}deg 360deg)`,
  }
})

const monthlyLocationBreakdown = computed(() => {
  const map = new Map<string, { done: number; total: number }>()
  for (const item of items.value) {
    const loc = item.location_note || 'Diğer'
    if (!map.has(loc)) map.set(loc, { done: 0, total: 0 })
    const entry = map.get(loc)!
    entry.total++
    if (monthlyRowStatus(item) === 'edildi') entry.done++
  }
  return [...map.entries()].map(([location, v]) => ({ location, ...v })).sort((a, b) => b.total - a.total)
})

const monthlyTotalPages = computed(() => Math.max(1, Math.ceil(monthlyFilteredItems.value.length / monthlyPageSize)))
const monthlyPagedItems = computed(() => {
  const start = (monthlyPage.value - 1) * monthlyPageSize
  return monthlyFilteredItems.value.slice(start, start + monthlyPageSize)
})
watch(monthlyFilteredItems, () => { if (monthlyPage.value > monthlyTotalPages.value) monthlyPage.value = 1 })

const monthlySelectedIds = ref<Set<number>>(new Set())
const monthlyAllSelected = computed(() => monthlyPagedItems.value.length > 0 && monthlyPagedItems.value.every(i => monthlySelectedIds.value.has(i.id)))
const toggleMonthlySelectAll = () => {
  monthlySelectedIds.value = monthlyAllSelected.value ? new Set() : new Set(monthlyPagedItems.value.map(i => i.id))
}
const toggleMonthlySelected = (id: number) => {
  const next = new Set(monthlySelectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  monthlySelectedIds.value = next
}

const inspectorName = (item: LocationEmergencyEquipmentItem) => item.latest_inspection?.inspected_by_name || item.latest_inspection?.inspected_by_user?.name || '—'
// Üstteki kartlar toplam içindeki PAY yüzdesini gösterir (mockup: 17/19 ->
// %89 "tamamlandı", 2/19 -> %11 "tamamlanmadı") - ikisi ayrı yüzdedir, ikisi
// toplamda 100 eder çünkü ikisi de aynı "toplam"a göre oran.
const monthlyBekliyorPct = computed(() => monthlyStats.value.total ? Math.round((monthlyStats.value.bekliyor / monthlyStats.value.total) * 100) : 0)

const exportMonthlyExcel = () => {
  const header = ['YSC Kodu', 'Tip/Kapasite', 'Konum', 'Kontrol Tarihi', 'Durum', 'Kontrol Eden']
  const rows = monthlyFilteredItems.value.map(item => [
    item.code || `YSC-${item.id}`,
    equipmentLabel(item),
    item.location_note || '',
    formatDate(item.latest_inspection?.inspected_at),
    monthlyStatusMeta[monthlyRowStatus(item)].label,
    inspectorName(item),
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aylik-kontrol-${monthLabel.value.replace(' ', '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// --- "Yıllık Bakımlar" tabı - Aylık Kontroller ile AYNI desen, ay yerine
// YIL bazlı. "Bakım Yapıldı" en_son_yıllık_bakım'ın seçili yıla denk gelmesi
// - "Süresi Geçti" ise backend'in zaten hesapladığı annual_control_status
// (next_annual_maintenance_date bazlı, şu anki zamana göre) - ikisi FARKLI
// eksenler (biri "bu yıl yapıldı mı", biri "genel olarak gecikmiş mi"),
// backend'in kendi hesabını tekrar üretmek yerine doğrudan kullanılır. ---
const annualYear = ref(new Date().getFullYear())
const annualSearch = ref('')
const annualStatusFilter = ref('')
const annualLocationFilter = ref('')
const annualPage = ref(1)
const annualPageSize = 10

const shiftYear = (delta: number) => { annualYear.value += delta; annualPage.value = 1 }
const isSameYear = (dateStr: string | null | undefined, year: number) => dateStr ? new Date(dateStr).getFullYear() === year : false

type AnnualRowStatus = 'yapildi' | 'bekliyor' | 'gecti'
const annualRowStatus = (item: LocationEmergencyEquipmentItem): AnnualRowStatus => {
  if (item.annual_control_status === 'gecikmis') return 'gecti'
  if (isSameYear(item.last_annual_maintenance_date, annualYear.value)) return 'yapildi'
  return 'bekliyor'
}
const annualStatusMeta: Record<AnnualRowStatus, { label: string; cls: string }> = {
  yapildi: { label: 'Bakım Yapıldı', cls: 'bg-emerald-50 text-emerald-700' },
  bekliyor: { label: 'Bakım Bekliyor', cls: 'bg-amber-50 text-amber-700' },
  gecti: { label: 'Süresi Geçti', cls: 'bg-red-50 text-red-700' },
}

const annualLocations = computed(() => [...new Set(items.value.map(i => i.location_note).filter((v): v is string => !!v))].sort())

const annualFilteredItems = computed(() => {
  const q = annualSearch.value.trim().toLocaleLowerCase('tr-TR')
  return items.value.filter((item) => {
    if (q && !`${item.code ?? ''} ${item.location_note ?? ''} ${item.equipment_type?.tip ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false
    if (annualLocationFilter.value && item.location_note !== annualLocationFilter.value) return false
    if (annualStatusFilter.value && annualRowStatus(item) !== annualStatusFilter.value) return false
    return true
  })
})

const annualStats = computed(() => {
  const all = items.value
  const yapildi = all.filter(i => annualRowStatus(i) === 'yapildi').length
  const gecti = all.filter(i => annualRowStatus(i) === 'gecti').length
  const total = all.length
  const bekliyor = total - yapildi - gecti
  const pct = total ? Math.round((yapildi / total) * 100) : 0
  return { yapildi, bekliyor, gecti, total, pct }
})
const annualBekliyorPct = computed(() => annualStats.value.total ? Math.round((annualStats.value.bekliyor / annualStats.value.total) * 100) : 0)

const annualDonutStyle = computed(() => {
  const { yapildi, bekliyor, total } = annualStats.value
  if (!total) return { background: '#e5e7eb' }
  const yapildiDeg = (yapildi / total) * 360
  const bekliyorDeg = (bekliyor / total) * 360
  return {
    background: `conic-gradient(#10b981 0deg ${yapildiDeg}deg, #f59e0b ${yapildiDeg}deg ${yapildiDeg + bekliyorDeg}deg, #ef4444 ${yapildiDeg + bekliyorDeg}deg 360deg)`,
  }
})

const annualLocationBreakdown = computed(() => {
  const map = new Map<string, { done: number; total: number }>()
  for (const item of items.value) {
    const loc = item.location_note || 'Diğer'
    if (!map.has(loc)) map.set(loc, { done: 0, total: 0 })
    const entry = map.get(loc)!
    entry.total++
    if (annualRowStatus(item) === 'yapildi') entry.done++
  }
  return [...map.entries()].map(([location, v]) => ({ location, ...v })).sort((a, b) => b.total - a.total)
})

const annualTotalPages = computed(() => Math.max(1, Math.ceil(annualFilteredItems.value.length / annualPageSize)))
const annualPagedItems = computed(() => {
  const start = (annualPage.value - 1) * annualPageSize
  return annualFilteredItems.value.slice(start, start + annualPageSize)
})
watch(annualFilteredItems, () => { if (annualPage.value > annualTotalPages.value) annualPage.value = 1 })

const annualSelectedIds = ref<Set<number>>(new Set())
const annualAllSelected = computed(() => annualPagedItems.value.length > 0 && annualPagedItems.value.every(i => annualSelectedIds.value.has(i.id)))
const toggleAnnualSelectAll = () => {
  annualSelectedIds.value = annualAllSelected.value ? new Set() : new Set(annualPagedItems.value.map(i => i.id))
}
const toggleAnnualSelected = (id: number) => {
  const next = new Set(annualSelectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  annualSelectedIds.value = next
}

const exportAnnualExcel = () => {
  const header = ['YSC Kodu', 'Tip/Kapasite', 'Konum', 'Son Yıllık Bakım', 'Sonraki Bakım', 'Durum', 'Bakım Firması']
  const rows = annualFilteredItems.value.map(item => [
    item.code || `YSC-${item.id}`,
    equipmentLabel(item),
    item.location_note || '',
    formatDate(item.last_annual_maintenance_date),
    formatDate(item.next_annual_maintenance_date),
    annualStatusMeta[annualRowStatus(item)].label,
    item.service_company || '',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `yillik-bakim-${annualYear.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// --- "4 Yıllık Dolumlar" tabı - Yıllık Bakımlar ile AYNI desen, sadece
// last_fill_date/next_fill_date/fill_status kullanır. Satır rozeti backend'in
// zaten hesapladığı fill_status'u (gecikmis/yaklasiyor/guncel) DOĞRUDAN
// gösterir (3 ayrı durum - annual/monthly'deki gibi tek "bekliyor" kovasına
// sıkıştırılmaz); üst kartlar/donut ise "bu YIL dolduruldu mu" eksenini
// (annual'daki AYNI mantık) kullanır - ikisi FARKLI sorular. Konum yerine
// EKİPMAN TİPİ bazında kırılım var (mockup: KKT/CO2/Sulu/Köpüklü/Diğer). ---
const fillYear = ref(new Date().getFullYear())
const fillSearch = ref('')
const fillStatusFilter = ref('')
const fillTypeFilter = ref('')
const fillLocationFilter = ref('')
const fillPage = ref(1)
const fillPageSize = 10

const shiftFillYear = (delta: number) => { fillYear.value += delta; fillPage.value = 1 }

const equipmentTypeLabel = (item: LocationEmergencyEquipmentItem) => item.equipment_type?.tip || item.equipment_type?.name || 'Diğer'

// Satır rozeti: backend'in kendi fill_status'u - gecikmis/yaklasiyor/guncel/
// null dörtlüsünü doğrudan "Süresi Geçti"/"Yaklaşıyor"/"Planlandı" göster.
const fillBadgeMeta: Record<string, { label: string; cls: string }> = {
  gecikmis: { label: 'Süresi Geçti', cls: 'bg-red-50 text-red-700' },
  yaklasiyor: { label: 'Yaklaşıyor', cls: 'bg-orange-50 text-orange-700' },
  guncel: { label: 'Planlandı', cls: 'bg-blue-50 text-blue-700' },
}
const fillBadge = (item: LocationEmergencyEquipmentItem) => fillBadgeMeta[item.fill_status ?? ''] ?? { label: 'Planlandı', cls: 'bg-blue-50 text-blue-700' }

// Üst kartlar/donut ekseni: annualRowStatus ile AYNI mantık, "bu yıl
// dolduruldu mu" (yapildi) / "gecikmiş mi" (gecti) / diğerleri (bekliyor).
type FillRowStatus = 'yapildi' | 'bekliyor' | 'gecti'
const fillRowStatus = (item: LocationEmergencyEquipmentItem): FillRowStatus => {
  if (item.fill_status === 'gecikmis') return 'gecti'
  if (isSameYear(item.last_fill_date, fillYear.value)) return 'yapildi'
  return 'bekliyor'
}

const fillTypes = computed(() => [...new Set(items.value.map(equipmentTypeLabel))].sort())
const fillLocations = computed(() => [...new Set(items.value.map(i => i.location_note).filter((v): v is string => !!v))].sort())

const fillFilteredItems = computed(() => {
  const q = fillSearch.value.trim().toLocaleLowerCase('tr-TR')
  return items.value.filter((item) => {
    if (q && !`${item.code ?? ''} ${item.location_note ?? ''} ${item.equipment_type?.tip ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false
    if (fillLocationFilter.value && item.location_note !== fillLocationFilter.value) return false
    if (fillTypeFilter.value && equipmentTypeLabel(item) !== fillTypeFilter.value) return false
    if (fillStatusFilter.value && fillRowStatus(item) !== fillStatusFilter.value) return false
    return true
  })
})

const fillTabStats = computed(() => {
  const all = items.value
  const yapildi = all.filter(i => fillRowStatus(i) === 'yapildi').length
  const gecti = all.filter(i => fillRowStatus(i) === 'gecti').length
  const total = all.length
  const bekliyor = total - yapildi - gecti
  const pct = total ? Math.round((yapildi / total) * 100) : 0
  return { yapildi, bekliyor, gecti, total, pct }
})
const fillBekliyorPct = computed(() => fillTabStats.value.total ? Math.round((fillTabStats.value.bekliyor / fillTabStats.value.total) * 100) : 0)

const fillDonutStyle = computed(() => {
  const { yapildi, bekliyor, total } = fillTabStats.value
  if (!total) return { background: '#e5e7eb' }
  const yapildiDeg = (yapildi / total) * 360
  const bekliyorDeg = (bekliyor / total) * 360
  return {
    background: `conic-gradient(#10b981 0deg ${yapildiDeg}deg, #f59e0b ${yapildiDeg}deg ${yapildiDeg + bekliyorDeg}deg, #ef4444 ${yapildiDeg + bekliyorDeg}deg 360deg)`,
  }
})

const fillTypeBreakdown = computed(() => {
  const map = new Map<string, { done: number; total: number }>()
  for (const item of items.value) {
    const type = equipmentTypeLabel(item)
    if (!map.has(type)) map.set(type, { done: 0, total: 0 })
    const entry = map.get(type)!
    entry.total++
    if (fillRowStatus(item) === 'yapildi') entry.done++
  }
  return [...map.entries()].map(([type, v]) => ({ type, ...v })).sort((a, b) => b.total - a.total)
})

const fillTotalPages = computed(() => Math.max(1, Math.ceil(fillFilteredItems.value.length / fillPageSize)))
const fillPagedItems = computed(() => {
  const start = (fillPage.value - 1) * fillPageSize
  return fillFilteredItems.value.slice(start, start + fillPageSize)
})
watch(fillFilteredItems, () => { if (fillPage.value > fillTotalPages.value) fillPage.value = 1 })

const fillSelectedIds = ref<Set<number>>(new Set())
const fillAllSelected = computed(() => fillPagedItems.value.length > 0 && fillPagedItems.value.every(i => fillSelectedIds.value.has(i.id)))
const toggleFillSelectAll = () => {
  fillSelectedIds.value = fillAllSelected.value ? new Set() : new Set(fillPagedItems.value.map(i => i.id))
}
const toggleFillSelected = (id: number) => {
  const next = new Set(fillSelectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  fillSelectedIds.value = next
}

const exportFillExcel = () => {
  const header = ['YSC Kodu', 'Tip/Kapasite', 'Konum', 'Son Dolum Tarihi', 'Sonraki Dolum Tarihi', 'Durum', 'Gün Kaldı']
  const rows = fillFilteredItems.value.map(item => [
    item.code || `YSC-${item.id}`,
    equipmentLabel(item),
    item.location_note || '',
    formatDate(item.last_fill_date),
    formatDate(item.next_fill_date),
    fillBadge(item).label,
    daysUntil(item.next_fill_date) ?? '',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `4-yillik-dolum-${fillYear.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// --- "Kontrol Geçmişi" tabı - Aylık/Yıllık/4 Yıllık'ın kendi ayrı özet
// alanları var, burada listedeki tüm cihazlardan gerçek verilerle TEK bir
// kontrol geçmişi akışı türetilir: her ekipmanın latest_inspection (aylık),
// last_annual_maintenance_date (yıllık) ve last_fill_date (4 yıllık) alanı
// varsa birer satır olur. Bilinen sınırlama (diğer sekmelerle aynı): backend
// sadece HER TİP için "en son" kaydı döndürüyor, tam denetim geçmişi değil -
// bu yüzden 156 satırlık mockup kadar derin geçmiş burada olmayabilir, ama
// her satır gerçek bir ekipmana ve gerçek bir tarihe dayanır. Durum: aylık
// için latest_inspection.overall_result (gerçek), yıllık/4 yıllık için o
// tipin GÜNCEL periyodik durumu (annual_control_status/fill_status) - ayrı
// bir "geçmiş sonuç" alanı backend'de yok, bu yüzden icat edilmez.
type HistoryControlType = 'Aylık Kontrol' | 'Yıllık Bakım' | '4 Yıllık Dolum'
type HistoryResult = 'uygun' | 'uygunsuz' | 'takipte'
type HistoryRow = {
  id: string
  item: LocationEmergencyEquipmentItem
  date: string
  controlType: HistoryControlType
  result: HistoryResult
  inspector: string
  note: string
}

const historyStatusMeta: Record<HistoryResult, { label: string; cls: string }> = {
  uygun: { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-700' },
  uygunsuz: { label: 'Uygunsuz', cls: 'bg-red-50 text-red-700' },
  takipte: { label: 'Takipte', cls: 'bg-orange-50 text-orange-700' },
}

const allHistoryRows = computed<HistoryRow[]>(() => {
  const rows: HistoryRow[] = []
  for (const item of items.value) {
    if (item.latest_inspection?.inspected_at) {
      rows.push({
        id: `monthly-${item.id}`,
        item,
        date: item.latest_inspection.inspected_at,
        controlType: 'Aylık Kontrol',
        result: item.latest_inspection.overall_result === 'passed' ? 'uygun' : 'uygunsuz',
        inspector: inspectorName(item),
        note: item.latest_inspection.notes || '',
      })
    }
    if (item.last_annual_maintenance_date) {
      rows.push({
        id: `annual-${item.id}`,
        item,
        date: item.last_annual_maintenance_date,
        controlType: 'Yıllık Bakım',
        result: item.annual_control_status === 'gecikmis' ? 'takipte' : 'uygun',
        inspector: item.service_company || '—',
        note: '',
      })
    }
    if (item.last_fill_date) {
      rows.push({
        id: `fill-${item.id}`,
        item,
        date: item.last_fill_date,
        controlType: '4 Yıllık Dolum',
        result: item.fill_status === 'gecikmis' ? 'takipte' : 'uygun',
        inspector: item.service_company || '—',
        note: '',
      })
    }
  }
  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const historyDateFrom = ref('')
const historyDateTo = ref('')
const historyTypeFilter = ref<HistoryControlType | ''>('')
const historyLocationFilter = ref('')
const historyStatusFilter = ref<HistoryResult | ''>('')
const historySearch = ref('')
const historyPage = ref(1)
const historyPageSize = 10

const historyControlTypes: HistoryControlType[] = ['Aylık Kontrol', 'Yıllık Bakım', '4 Yıllık Dolum']
const historyLocations = computed(() => [...new Set(items.value.map(i => i.location_note).filter((v): v is string => !!v))].sort())

const historyFilteredRows = computed(() => {
  const q = historySearch.value.trim().toLocaleLowerCase('tr-TR')
  const from = historyDateFrom.value ? new Date(historyDateFrom.value).getTime() : null
  const to = historyDateTo.value ? new Date(historyDateTo.value).getTime() : null
  return allHistoryRows.value.filter((row) => {
    if (q && !`${row.item.code ?? ''} ${row.item.location_note ?? ''} ${row.inspector}`.toLocaleLowerCase('tr-TR').includes(q)) return false
    if (historyTypeFilter.value && row.controlType !== historyTypeFilter.value) return false
    if (historyLocationFilter.value && row.item.location_note !== historyLocationFilter.value) return false
    if (historyStatusFilter.value && row.result !== historyStatusFilter.value) return false
    const t = new Date(row.date).getTime()
    if (from !== null && t < from) return false
    if (to !== null && t > to + 86399999) return false
    return true
  })
})

const historyStats = computed(() => {
  const total = historyFilteredRows.value.length
  const uygun = historyFilteredRows.value.filter(r => r.result === 'uygun').length
  const uygunsuz = historyFilteredRows.value.filter(r => r.result === 'uygunsuz').length
  const takipte = historyFilteredRows.value.filter(r => r.result === 'takipte').length
  return { total, uygun, uygunsuz, takipte }
})
const historyPctOf = (part: number) => historyStats.value.total ? Math.round((part / historyStats.value.total) * 1000) / 10 : 0
const historyUygunPct = computed(() => historyPctOf(historyStats.value.uygun))
const historyUygunsuzPct = computed(() => historyPctOf(historyStats.value.uygunsuz))
const historyTakiptePct = computed(() => historyPctOf(historyStats.value.takipte))

const historyDonutStyle = computed(() => {
  const { uygun, uygunsuz, total } = historyStats.value
  if (!total) return { background: '#e5e7eb' }
  const uygunDeg = (uygun / total) * 360
  const uygunsuzDeg = (uygunsuz / total) * 360
  return {
    background: `conic-gradient(#10b981 0deg ${uygunDeg}deg, #ef4444 ${uygunDeg}deg ${uygunDeg + uygunsuzDeg}deg, #f59e0b ${uygunDeg + uygunsuzDeg}deg 360deg)`,
  }
})

const recentHistoryRows = computed(() => allHistoryRows.value.slice(0, 5))

const historyTotalPages = computed(() => Math.max(1, Math.ceil(historyFilteredRows.value.length / historyPageSize)))
const historyPagedRows = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize
  return historyFilteredRows.value.slice(start, start + historyPageSize)
})
watch(historyFilteredRows, () => { if (historyPage.value > historyTotalPages.value) historyPage.value = 1 })

const historySelectedIds = ref<Set<string>>(new Set())
const historyAllSelected = computed(() => historyPagedRows.value.length > 0 && historyPagedRows.value.every(r => historySelectedIds.value.has(r.id)))
const toggleHistorySelectAll = () => {
  historySelectedIds.value = historyAllSelected.value ? new Set() : new Set(historyPagedRows.value.map(r => r.id))
}
const toggleHistorySelected = (id: string) => {
  const next = new Set(historySelectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  historySelectedIds.value = next
}

const exportHistoryExcel = () => {
  const header = ['Tarih', 'YSC Kodu', 'Tip/Kapasite', 'Konum', 'Kontrol Türü', 'Kontrol Eden', 'Durum', 'Not']
  const rows = historyFilteredRows.value.map(row => [
    formatDate(row.date),
    row.item.code || `YSC-${row.item.id}`,
    equipmentLabel(row.item),
    row.item.location_note || '',
    row.controlType,
    row.inspector,
    historyStatusMeta[row.result].label,
    row.note,
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kontrol-gecmisi.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] bg-[#f6f8fb] text-[#12204b]">
    <main class="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <div class="mb-1 text-[12px] font-semibold text-[#1b4297]">Olivium Burger <span class="mx-2 text-gray-300">›</span> Yangın Yönetimi <span class="mx-2 text-gray-300">›</span> Yangın Söndürücüler (YSC)</div>
          <div v-if="activeTab === 'monthly'" class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"><img src="/images/fire-extinguisher.svg" class="h-11 w-8 object-contain" alt="Yangın söndürücü" /></div>
            <div><h1 class="text-[28px] font-extrabold tracking-[-.03em]">Aylık Kontroller</h1><p class="text-sm text-[#64748b]">Şubenizdeki yangın söndürücülerin aylık kontrol durumlarını görüntüleyin, kayıt alın.</p></div>
          </div>
          <div v-else-if="activeTab === 'annual'" class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"><img src="/images/fire-extinguisher.svg" class="h-11 w-8 object-contain" alt="Yangın söndürücü" /></div>
            <div><h1 class="text-[28px] font-extrabold tracking-[-.03em]">Yıllık Bakımlar</h1><p class="text-sm text-[#64748b]">Şubenizdeki yangın söndürücülerin yıllık bakım durumlarını takip edin, planlayın ve yönetin.</p></div>
          </div>
          <div v-else-if="activeTab === 'fill'" class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"><img src="/images/fire-extinguisher.svg" class="h-11 w-8 object-contain" alt="Yangın söndürücü" /></div>
            <div><h1 class="text-[28px] font-extrabold tracking-[-.03em]">4 Yıllık Dolumlar</h1><p class="text-sm text-[#64748b]">Şubenizdeki yangın söndürücülerin 4 yıllık dolum durumlarını takip edin ve planlayın.</p></div>
          </div>
          <div v-else-if="activeTab === 'history'" class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"><img src="/images/fire-extinguisher.svg" class="h-11 w-8 object-contain" alt="Yangın söndürücü" /></div>
            <div><h1 class="text-[28px] font-extrabold tracking-[-.03em]">Kontrol Geçmişi</h1><p class="text-sm text-[#64748b]">Şubenizdeki yangın söndürücülerin tüm kontrol, bakım ve dolum geçmişini görüntüleyin.</p></div>
          </div>
          <div v-else class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"><img src="/images/fire-extinguisher.svg" class="h-11 w-8 object-contain" alt="Yangın söndürücü" /></div>
            <div><h1 class="text-[28px] font-extrabold tracking-[-.03em]">Yangın Söndürücüler (YSC)</h1><p class="text-sm text-[#64748b]">Şubedeki yangın söndürücülerin kontrol, bakım ve dolum süreçlerini yönetin.</p></div>
          </div>
        </div>
        <button v-if="activeTab === 'monthly'" class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#e30613] px-5 text-sm font-bold text-white shadow-lg shadow-red-100"><Plus :size="18" /> Yeni Kontrol Ekle</button>
        <button v-else-if="activeTab === 'annual'" class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#e30613] px-5 text-sm font-bold text-white shadow-lg shadow-red-100"><Plus :size="18" /> Yeni Yıllık Bakım Planla</button>
        <button v-else-if="activeTab === 'fill'" class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#e30613] px-5 text-sm font-bold text-white shadow-lg shadow-red-100"><Plus :size="18" /> Yeni Dolum Kaydı</button>
        <button v-else-if="activeTab === 'history'" class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#e30613] px-5 text-sm font-bold text-white shadow-lg shadow-red-100"><Plus :size="18" /> Yeni Kontrol Kaydı</button>
        <button v-else class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#e30613] px-5 text-sm font-bold text-white shadow-lg shadow-red-100"><Plus :size="18" /> Yeni YSC Ekle</button>
      </div>

      <!-- Aylık Kontroller: kendi özet kartları (toplam / bu ay kontrol edilen / bekleyen / süresi geçen) -->
      <section v-if="activeTab === 'monthly'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-blue-100 bg-[#f0f7ff] p-4"><div class="flex items-center gap-3"><img src="/images/fire-extinguisher.svg" class="h-12 w-9 object-contain" /><div><div class="text-xs font-semibold text-[#64748b]">Toplam YSC</div><div class="mt-1 text-[27px] font-extrabold">{{ items.length }}</div><div class="text-[11px] text-[#64748b]">Şubedeki toplam söndürücü</div></div></div></div>
        <div class="rounded-xl border border-emerald-100 bg-[#effcf7] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CheckCircle2 class="text-emerald-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Bu Ay Kontrol Edilen</div><div class="mt-1 text-[27px] font-extrabold">{{ monthlyStats.edildi }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-emerald-600">%{{ monthlyStats.pct }} tamamlandı</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${monthlyStats.pct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-orange-100 bg-[#fff8ed] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CalendarDays class="text-orange-500" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Kontrol Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ monthlyStats.bekliyor }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-orange-600">%{{ monthlyBekliyorPct }} tamamlanmadı</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-orange-100"><div class="h-full rounded-full bg-orange-500" :style="{ width: `${monthlyBekliyorPct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-red-100 bg-[#fff1f2] p-4"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><ShieldCheck class="text-red-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Süresi Geçen</div><div class="mt-1 text-[27px] font-extrabold">{{ monthlyStats.gecti }}</div><div class="text-[11px] text-[#64748b]">{{ monthlyStats.gecti ? 'Acil işlem gerekli' : 'Gecikmiş kontrol yok' }}</div></div></div></div>
      </section>

      <!-- Yıllık Bakımlar: kendi özet kartları -->
      <section v-else-if="activeTab === 'annual'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-blue-100 bg-[#f0f7ff] p-4"><div class="flex items-center gap-3"><img src="/images/fire-extinguisher.svg" class="h-12 w-9 object-contain" /><div><div class="text-xs font-semibold text-[#64748b]">Toplam YSC</div><div class="mt-1 text-[27px] font-extrabold">{{ items.length }}</div><div class="text-[11px] text-[#64748b]">Şubedeki toplam söndürücü</div></div></div></div>
        <div class="rounded-xl border border-emerald-100 bg-[#effcf7] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CheckCircle2 class="text-emerald-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Bu Yıl Bakımı Yapılan</div><div class="mt-1 text-[27px] font-extrabold">{{ annualStats.yapildi }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-emerald-600">%{{ annualStats.pct }} tamamlandı</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${annualStats.pct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-orange-100 bg-[#fff8ed] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CalendarDays class="text-orange-500" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Bakım Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ annualStats.bekliyor }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-orange-600">%{{ annualBekliyorPct }} tamamlanmadı</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-orange-100"><div class="h-full rounded-full bg-orange-500" :style="{ width: `${annualBekliyorPct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-red-100 bg-[#fff1f2] p-4"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><ShieldCheck class="text-red-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Süresi Geçen</div><div class="mt-1 text-[27px] font-extrabold">{{ annualStats.gecti }}</div><div class="text-[11px] text-[#64748b]">{{ annualStats.gecti ? 'Acil işlem gerekli' : 'Gecikmiş bakım yok' }}</div></div></div></div>
      </section>

      <!-- 4 Yıllık Dolumlar: kendi özet kartları -->
      <section v-else-if="activeTab === 'fill'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-blue-100 bg-[#f0f7ff] p-4"><div class="flex items-center gap-3"><img src="/images/fire-extinguisher.svg" class="h-12 w-9 object-contain" /><div><div class="text-xs font-semibold text-[#64748b]">Toplam YSC</div><div class="mt-1 text-[27px] font-extrabold">{{ items.length }}</div><div class="text-[11px] text-[#64748b]">Şubedeki toplam söndürücü</div></div></div></div>
        <div class="rounded-xl border border-emerald-100 bg-[#effcf7] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CheckCircle2 class="text-emerald-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">4 Yıllık Dolumu Yapılan</div><div class="mt-1 text-[27px] font-extrabold">{{ fillTabStats.yapildi }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-emerald-600">%{{ fillTabStats.pct }} tamamlandı</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${fillTabStats.pct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-orange-100 bg-[#fff8ed] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CalendarDays class="text-orange-500" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Dolum Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ fillTabStats.bekliyor }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-orange-600">%{{ fillBekliyorPct }} tamamlanmadı</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-orange-100"><div class="h-full rounded-full bg-orange-500" :style="{ width: `${fillBekliyorPct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-red-100 bg-[#fff1f2] p-4"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><ShieldCheck class="text-red-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Süresi Geçen</div><div class="mt-1 text-[27px] font-extrabold">{{ fillTabStats.gecti }}</div><div class="text-[11px] text-[#64748b]">{{ fillTabStats.gecti ? 'Acil işlem gerekli' : 'Gecikmiş dolum yok' }}</div></div></div></div>
      </section>

      <!-- Kontrol Geçmişi: kendi özet kartları -->
      <section v-else-if="activeTab === 'history'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-blue-100 bg-[#f0f7ff] p-4"><div class="flex items-center gap-3"><img src="/images/fire-extinguisher.svg" class="h-12 w-9 object-contain" /><div><div class="text-xs font-semibold text-[#64748b]">Toplam Kayıt</div><div class="mt-1 text-[27px] font-extrabold">{{ historyStats.total }}</div><div class="text-[11px] text-[#64748b]">Tüm kontrol geçmişi</div></div></div></div>
        <div class="rounded-xl border border-emerald-100 bg-[#effcf7] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CheckCircle2 class="text-emerald-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Uygun</div><div class="mt-1 text-[27px] font-extrabold">{{ historyStats.uygun }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-emerald-600">%{{ historyUygunPct }}</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${historyUygunPct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-red-100 bg-[#fff1f2] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><ShieldCheck class="text-red-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Uygunsuz</div><div class="mt-1 text-[27px] font-extrabold">{{ historyStats.uygunsuz }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-red-600">%{{ historyUygunsuzPct }}</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-red-100"><div class="h-full rounded-full bg-red-500" :style="{ width: `${historyUygunsuzPct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-orange-100 bg-[#fff8ed] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CalendarDays class="text-orange-500" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Takipte</div><div class="mt-1 text-[27px] font-extrabold">{{ historyStats.takipte }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-orange-600">%{{ historyTakiptePct }}</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-orange-100"><div class="h-full rounded-full bg-orange-500" :style="{ width: `${historyTakiptePct}%` }" /></div>
        </div>
      </section>

      <!-- Genel Bakış: paylaşılan özet kartları - annual/monthly/fill kartlarıyla
           AYNI yükseklik (p-4, ikon 48px, başlık+değer stack) + progress bar (annual/monthly/fill'de
           olduğu gibi ilerleme çubuğu görünümü korunur, oranlar toplam üzerinden hesaplanır). -->
      <section v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-xl border border-blue-100 bg-[#f0f7ff] p-4"><div class="flex items-center gap-3"><img src="/images/fire-extinguisher.svg" class="h-12 w-9 object-contain" /><div><div class="text-xs font-semibold text-[#64748b]">Toplam YSC</div><div class="mt-1 text-[27px] font-extrabold">{{ items.length }}</div><div class="text-[11px] text-[#64748b]">Bu şubedeki söndürücüler</div></div></div></div>
        <div class="rounded-xl border border-emerald-100 bg-[#effcf7] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CheckCircle2 class="text-emerald-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Aktif</div><div class="mt-1 text-[27px] font-extrabold">{{ activeCount }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-emerald-600">%{{ overviewActivePct }} kullanıma hazır</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${overviewActivePct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-orange-100 bg-[#fff8ed] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><CalendarDays class="text-orange-500" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Aylık Kontrol Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ monthlyPending }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-orange-600">%{{ overviewMonthlyPendingPct }} yaklaşan veya geciken</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-orange-100"><div class="h-full rounded-full bg-orange-500" :style="{ width: `${overviewMonthlyPendingPct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-red-100 bg-[#fff1f2] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><ShieldCheck class="text-red-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">Yıllık Bakım Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ annualPending }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-red-600">%{{ overviewAnnualPendingPct }} akredite bakım süreci</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-red-100"><div class="h-full rounded-full bg-red-500" :style="{ width: `${overviewAnnualPendingPct}%` }" /></div>
        </div>
        <div class="rounded-xl border border-violet-100 bg-[#f7f2ff] p-4">
          <div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white"><Wrench class="text-violet-600" :size="25" /></div><div><div class="text-xs font-semibold text-[#64748b]">4 Yıllık Dolum Bekleyen</div><div class="mt-1 text-[27px] font-extrabold">{{ fillPending }}</div></div></div>
          <p class="mt-2 text-[11px] font-semibold text-violet-600">%{{ overviewFillPendingPct }} dolum zamanı gelen</p>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-violet-100"><div class="h-full rounded-full bg-violet-500" :style="{ width: `${overviewFillPendingPct}%` }" /></div>
        </div>
      </section>

      <div class="mt-4 flex overflow-x-auto rounded-xl border border-[#e5e9ef] bg-white">
        <button v-for="tab in [{id:'overview',label:'Genel Bakış'},{id:'monthly',label:'Aylık Kontroller'},{id:'annual',label:'Yıllık Bakımlar'},{id:'fill',label:'4 Yıllık Dolumlar'},{id:'history',label:'Kontrol Geçmişi'}]" :key="tab.id" @click="activeTab = tab.id as typeof activeTab" :class="['min-w-[165px] border-r border-[#edf0f3] px-5 py-3 text-sm font-semibold last:border-0', activeTab === tab.id ? 'bg-[#e30613] text-white' : 'text-[#1d376e] hover:bg-gray-50']">{{ tab.label }}</button>
      </div>

      <section v-if="activeTab === 'overview'" class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
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

      <!-- Aylık Kontroller: kendi ay bazlı görünümü - ay seçici, arama/filtre,
           kendi tablosu, sağda tamamlanma donut'u + konum bazlı kırılım. -->
      <section v-else-if="activeTab === 'monthly'" class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div class="overflow-hidden rounded-xl border border-[#e5e9ef] bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <CalendarDays :size="16" class="text-[#d71920]" />
              <span class="min-w-[110px] text-sm font-semibold capitalize">{{ monthLabel }}</span>
              <button type="button" class="rounded p-1 hover:bg-gray-100" @click="shiftMonth(-1)"><ChevronRight :size="15" class="rotate-180 text-gray-500" /></button>
              <button type="button" class="rounded p-1 hover:bg-gray-100" @click="shiftMonth(1)"><ChevronRight :size="15" class="text-gray-500" /></button>
            </div>
          </div>
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 xl:flex-row xl:items-center">
            <div class="relative flex-1"><Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#d71920]" /><input v-model="monthlySearch" class="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-[#d71920]" placeholder="YSC kodu, konum veya tip ara..." /></div>
            <select v-model="monthlyStatusFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Tüm Durumlar</option>
              <option value="edildi">Kontrol Edildi</option>
              <option value="bekliyor">Kontrol Bekliyor</option>
              <option value="gecti">Süresi Geçti</option>
            </select>
            <select v-model="monthlyLocationFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Tüm Konumlar</option>
              <option v-for="loc in monthlyLocations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold" @click="exportMonthlyExcel"><Download :size="15" class="mr-2 inline" />Excel'e Aktar</button>
          </div>
          <div v-if="loading" class="p-12 text-center text-sm text-gray-500">YSC kayıtları yükleniyor...</div>
          <div v-else-if="!monthlyFilteredItems.length" class="p-12 text-center text-sm text-gray-500">Bu filtreye uygun kayıt bulunamadı.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-[1050px] w-full text-left">
              <thead>
                <tr class="bg-[#f8fafc] text-[11px] font-bold text-[#64748b]">
                  <th class="w-10 px-4 py-3"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="monthlyAllSelected" @change="toggleMonthlySelectAll"></th>
                  <th class="px-3 py-3">Fotoğraf</th>
                  <th class="px-3 py-3">YSC Kodu</th>
                  <th class="px-3 py-3">Tip / Kapasite</th>
                  <th class="px-3 py-3">Konum</th>
                  <th class="px-3 py-3">Kontrol Tarihi</th>
                  <th class="px-3 py-3">Durum</th>
                  <th class="px-3 py-3">Kontrol Eden</th>
                  <th class="px-3 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in monthlyPagedItems" :key="item.id" class="border-t border-[#edf0f3] hover:bg-[#fffafa]">
                  <td class="px-4 py-2"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="monthlySelectedIds.has(item.id)" @change="toggleMonthlySelected(item.id)"></td>
                  <td class="px-3 py-2"><div class="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-50"><img src="/images/fire-extinguisher.svg" class="h-10 w-7 object-contain" alt="YSC" /></div></td>
                  <td class="px-3 py-3 text-sm font-bold text-[#17367d]">{{ item.code || `YSC-${item.id}` }}</td>
                  <td class="px-3 py-3 text-xs font-medium">{{ equipmentLabel(item) }}</td>
                  <td class="px-3 py-3 text-xs">{{ item.location_note || '—' }}</td>
                  <td class="px-3 py-3 text-xs">{{ monthlyRowStatus(item) === 'edildi' ? formatDate(item.latest_inspection?.inspected_at) : '—' }}</td>
                  <td class="px-3 py-3"><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="monthlyStatusMeta[monthlyRowStatus(item)].cls">{{ monthlyStatusMeta[monthlyRowStatus(item)].label }}</span></td>
                  <td class="px-3 py-3 text-xs">{{ monthlyRowStatus(item) === 'edildi' ? inspectorName(item) : '—' }}</td>
                  <td class="px-3 py-3">
                    <div class="flex items-center gap-1">
                      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100" @click="selectItem(item)"><Eye :size="15" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex flex-col items-center justify-between gap-2 border-t border-[#edf0f3] px-4 py-3 text-xs text-[#64748b] sm:flex-row">
            <span>{{ monthlyPagedItems.length }} kayıt gösteriliyor. Toplam {{ monthlyFilteredItems.length }} kayıt.</span>
            <div v-if="monthlyTotalPages > 1" class="flex items-center gap-1">
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="monthlyPage === 1" @click="monthlyPage--"><ChevronRight :size="14" class="rotate-180" /></button>
              <button
                v-for="p in monthlyTotalPages"
                :key="p"
                type="button"
                class="h-7 w-7 rounded-lg text-[11px] font-bold"
                :class="p === monthlyPage ? 'bg-[#e30613] text-white' : 'hover:bg-gray-100'"
                @click="monthlyPage = p"
              >{{ p }}</button>
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="monthlyPage === monthlyTotalPages" @click="monthlyPage++"><ChevronRight :size="14" /></button>
            </div>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">Aylık Kontrol Durumu</h3>
            <div class="mt-4 flex justify-center">
              <div class="relative flex h-32 w-32 items-center justify-center rounded-full" :style="monthlyDonutStyle">
                <div class="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center">
                  <span class="text-xl font-extrabold text-[#12204b]">%{{ monthlyStats.pct }}</span>
                  <span class="text-[10px] text-gray-400">Tamamlandı</span>
                </div>
              </div>
            </div>
            <div class="mt-4 space-y-1.5 text-xs">
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Kontrol Edilen</span><span class="font-bold">{{ monthlyStats.edildi }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Kontrol Bekleyen</span><span class="font-bold">{{ monthlyStats.bekliyor }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-red-500"></span>Süresi Geçen</span><span class="font-bold">{{ monthlyStats.gecti }}</span></div>
              <div class="flex items-center justify-between border-t border-gray-100 pt-1.5"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-gray-300"></span>Toplam</span><span class="font-bold">{{ monthlyStats.total }}</span></div>
            </div>
          </div>

          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">Konum Bazında Durum</h3>
            <div class="mt-3 space-y-3">
              <div v-for="loc in monthlyLocationBreakdown" :key="loc.location">
                <div class="mb-1 flex items-center justify-between text-xs"><span class="text-gray-600">{{ loc.location }}</span><span class="font-semibold text-gray-500">{{ loc.done }} / {{ loc.total }}</span></div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${loc.total ? (loc.done / loc.total) * 100 : 0}%` }" /></div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-blue-100 bg-[#eff6ff] p-4 text-xs text-[#1d4ed8]">
            <CalendarDays :size="16" class="mb-1.5" />
            Tüm YSC'lerin aylık kontrollerini eksiksiz yaparak yangın güvenliğini sağlayın.
          </div>
        </aside>
      </section>

      <!-- Yıllık Bakımlar: kendi yıl bazlı görünümü - Aylık Kontroller ile AYNI desen. -->
      <section v-else-if="activeTab === 'annual'" class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div class="overflow-hidden rounded-xl border border-[#e5e9ef] bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <CalendarDays :size="16" class="text-[#d71920]" />
              <span class="min-w-[70px] text-sm font-semibold">{{ annualYear }}</span>
              <button type="button" class="rounded p-1 hover:bg-gray-100" @click="shiftYear(-1)"><ChevronRight :size="15" class="rotate-180 text-gray-500" /></button>
              <button type="button" class="rounded p-1 hover:bg-gray-100" @click="shiftYear(1)"><ChevronRight :size="15" class="text-gray-500" /></button>
            </div>
          </div>
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 xl:flex-row xl:items-center">
            <div class="relative flex-1"><Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#d71920]" /><input v-model="annualSearch" class="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-[#d71920]" placeholder="YSC kodu, konum veya tip ara..." /></div>
            <select v-model="annualStatusFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Tüm Durumlar</option>
              <option value="yapildi">Bakım Yapıldı</option>
              <option value="bekliyor">Bakım Bekliyor</option>
              <option value="gecti">Süresi Geçti</option>
            </select>
            <select v-model="annualLocationFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Tüm Konumlar</option>
              <option v-for="loc in annualLocations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold" @click="exportAnnualExcel"><Download :size="15" class="mr-2 inline" />Excel'e Aktar</button>
          </div>
          <div v-if="loading" class="p-12 text-center text-sm text-gray-500">YSC kayıtları yükleniyor...</div>
          <div v-else-if="!annualFilteredItems.length" class="p-12 text-center text-sm text-gray-500">Bu filtreye uygun kayıt bulunamadı.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-[1150px] w-full text-left">
              <thead>
                <tr class="bg-[#f8fafc] text-[11px] font-bold text-[#64748b]">
                  <th class="w-10 px-4 py-3"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="annualAllSelected" @change="toggleAnnualSelectAll"></th>
                  <th class="px-3 py-3">Fotoğraf</th>
                  <th class="px-3 py-3">YSC Kodu</th>
                  <th class="px-3 py-3">Tip / Kapasite</th>
                  <th class="px-3 py-3">Konum</th>
                  <th class="px-3 py-3">Son Yıllık Bakım</th>
                  <th class="px-3 py-3">Sonraki Bakım</th>
                  <th class="px-3 py-3">Durum</th>
                  <th class="px-3 py-3">Bakım Firması</th>
                  <th class="px-3 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in annualPagedItems" :key="item.id" class="border-t border-[#edf0f3] hover:bg-[#fffafa]">
                  <td class="px-4 py-2"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="annualSelectedIds.has(item.id)" @change="toggleAnnualSelected(item.id)"></td>
                  <td class="px-3 py-2"><div class="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-50"><img src="/images/fire-extinguisher.svg" class="h-10 w-7 object-contain" alt="YSC" /></div></td>
                  <td class="px-3 py-3 text-sm font-bold text-[#17367d]">{{ item.code || `YSC-${item.id}` }}</td>
                  <td class="px-3 py-3 text-xs font-medium">{{ equipmentLabel(item) }}</td>
                  <td class="px-3 py-3 text-xs">{{ item.location_note || '—' }}</td>
                  <td class="px-3 py-3 text-xs">{{ formatDate(item.last_annual_maintenance_date) }}</td>
                  <td class="px-3 py-3 text-xs font-semibold">{{ formatDate(item.next_annual_maintenance_date) }}</td>
                  <td class="px-3 py-3"><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="annualStatusMeta[annualRowStatus(item)].cls">{{ annualStatusMeta[annualRowStatus(item)].label }}</span></td>
                  <td class="px-3 py-3 text-xs">{{ item.service_company || '—' }}</td>
                  <td class="px-3 py-3">
                    <div class="flex items-center gap-1">
                      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100" @click="selectItem(item)"><Eye :size="15" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex flex-col items-center justify-between gap-2 border-t border-[#edf0f3] px-4 py-3 text-xs text-[#64748b] sm:flex-row">
            <span>{{ annualPagedItems.length }} kayıt gösteriliyor. Toplam {{ annualFilteredItems.length }} kayıt.</span>
            <div v-if="annualTotalPages > 1" class="flex items-center gap-1">
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="annualPage === 1" @click="annualPage--"><ChevronRight :size="14" class="rotate-180" /></button>
              <button
                v-for="p in annualTotalPages"
                :key="p"
                type="button"
                class="h-7 w-7 rounded-lg text-[11px] font-bold"
                :class="p === annualPage ? 'bg-[#e30613] text-white' : 'hover:bg-gray-100'"
                @click="annualPage = p"
              >{{ p }}</button>
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="annualPage === annualTotalPages" @click="annualPage++"><ChevronRight :size="14" /></button>
            </div>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">Yıllık Bakım Durumu</h3>
            <div class="mt-4 flex justify-center">
              <div class="relative flex h-32 w-32 items-center justify-center rounded-full" :style="annualDonutStyle">
                <div class="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center">
                  <span class="text-xl font-extrabold text-[#12204b]">%{{ annualStats.pct }}</span>
                  <span class="text-[10px] text-gray-400">Tamamlandı</span>
                </div>
              </div>
            </div>
            <div class="mt-4 space-y-1.5 text-xs">
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Bakım Yapıldı</span><span class="font-bold">{{ annualStats.yapildi }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Bakım Bekliyor</span><span class="font-bold">{{ annualStats.bekliyor }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-red-500"></span>Süresi Geçen</span><span class="font-bold">{{ annualStats.gecti }}</span></div>
              <div class="flex items-center justify-between border-t border-gray-100 pt-1.5"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-gray-300"></span>Toplam</span><span class="font-bold">{{ annualStats.total }}</span></div>
            </div>
          </div>

          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">Konum Bazında Durum</h3>
            <div class="mt-3 space-y-3">
              <div v-for="loc in annualLocationBreakdown" :key="loc.location">
                <div class="mb-1 flex items-center justify-between text-xs"><span class="text-gray-600">{{ loc.location }}</span><span class="font-semibold text-gray-500">{{ loc.done }} / {{ loc.total }}</span></div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${loc.total ? (loc.done / loc.total) * 100 : 0}%` }" /></div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-blue-100 bg-[#eff6ff] p-4 text-xs text-[#1d4ed8]">
            <CalendarDays :size="16" class="mb-1.5" />
            <span class="font-semibold">Planlı Bakım Takvimi</span> — yaklaşan yıllık bakımlarınızı planlamaya yönelik.
          </div>
        </aside>
      </section>

      <!-- 4 Yıllık Dolumlar: Yıllık Bakımlar ile AYNI desen; sağ kırılım konum yerine
           EKİPMAN TİPİ bazında (mockup gereği). -->
      <section v-else-if="activeTab === 'fill'" class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div class="overflow-hidden rounded-xl border border-[#e5e9ef] bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <CalendarDays :size="16" class="text-[#d71920]" />
              <span class="min-w-[70px] text-sm font-semibold">{{ fillYear }}</span>
              <button type="button" class="rounded p-1 hover:bg-gray-100" @click="shiftFillYear(-1)"><ChevronRight :size="15" class="rotate-180 text-gray-500" /></button>
              <button type="button" class="rounded p-1 hover:bg-gray-100" @click="shiftFillYear(1)"><ChevronRight :size="15" class="text-gray-500" /></button>
            </div>
          </div>
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 xl:flex-row xl:items-center">
            <div class="relative flex-1"><Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#d71920]" /><input v-model="fillSearch" class="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-[#d71920]" placeholder="YSC kodu, konum veya tip ara..." /></div>
            <select v-model="fillStatusFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Tüm Durumlar</option>
              <option value="yapildi">Dolum Yapıldı</option>
              <option value="bekliyor">Dolum Bekliyor</option>
              <option value="gecti">Süresi Geçti</option>
            </select>
            <select v-model="fillTypeFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Tüm Tipler</option>
              <option v-for="type in fillTypes" :key="type" :value="type">{{ type }}</option>
            </select>
            <select v-model="fillLocationFilter" class="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Tüm Konumlar</option>
              <option v-for="loc in fillLocations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold"><SlidersHorizontal :size="15" class="mr-2 inline" />Filtrele</button>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold" @click="exportFillExcel"><Download :size="15" class="mr-2 inline" />Excel'e Aktar</button>
          </div>
          <div v-if="loading" class="p-12 text-center text-sm text-gray-500">YSC kayıtları yükleniyor...</div>
          <div v-else-if="!fillFilteredItems.length" class="p-12 text-center text-sm text-gray-500">Bu filtreye uygun kayıt bulunamadı.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-[1150px] w-full text-left">
              <thead>
                <tr class="bg-[#f8fafc] text-[11px] font-bold text-[#64748b]">
                  <th class="w-10 px-4 py-3"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="fillAllSelected" @change="toggleFillSelectAll"></th>
                  <th class="px-3 py-3">Fotoğraf</th>
                  <th class="px-3 py-3">YSC Kodu</th>
                  <th class="px-3 py-3">Tip / Kapasite</th>
                  <th class="px-3 py-3">Konum</th>
                  <th class="px-3 py-3">Son Dolum Tarihi</th>
                  <th class="px-3 py-3">Sonraki Dolum Tarihi</th>
                  <th class="px-3 py-3">Durum</th>
                  <th class="px-3 py-3">Gün Kaldı</th>
                  <th class="px-3 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in fillPagedItems" :key="item.id" class="border-t border-[#edf0f3] hover:bg-[#fffafa]">
                  <td class="px-4 py-2"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="fillSelectedIds.has(item.id)" @change="toggleFillSelected(item.id)"></td>
                  <td class="px-3 py-2"><div class="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-50"><img src="/images/fire-extinguisher.svg" class="h-10 w-7 object-contain" alt="YSC" /></div></td>
                  <td class="px-3 py-3 text-sm font-bold text-[#17367d]">{{ item.code || `YSC-${item.id}` }}</td>
                  <td class="px-3 py-3 text-xs font-medium">{{ equipmentLabel(item) }}</td>
                  <td class="px-3 py-3 text-xs">{{ item.location_note || '—' }}</td>
                  <td class="px-3 py-3 text-xs">{{ formatDate(item.last_fill_date) }}</td>
                  <td class="px-3 py-3 text-xs font-semibold">{{ formatDate(item.next_fill_date) }}</td>
                  <td class="px-3 py-3"><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="fillBadge(item).cls">{{ fillBadge(item).label }}</span></td>
                  <td class="px-3 py-3 text-xs font-semibold" :class="(daysUntil(item.next_fill_date) ?? 0) < 0 ? 'text-red-600' : 'text-[#12204b]'">{{ daysUntil(item.next_fill_date) !== null ? daysUntil(item.next_fill_date) : '—' }}</td>
                  <td class="px-3 py-3">
                    <div class="flex items-center gap-1">
                      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100" @click="selectItem(item)"><Eye :size="15" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex flex-col items-center justify-between gap-2 border-t border-[#edf0f3] px-4 py-3 text-xs text-[#64748b] sm:flex-row">
            <span>{{ fillPagedItems.length }} kayıt gösteriliyor. Toplam {{ fillFilteredItems.length }} kayıt.</span>
            <div v-if="fillTotalPages > 1" class="flex items-center gap-1">
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="fillPage === 1" @click="fillPage--"><ChevronRight :size="14" class="rotate-180" /></button>
              <button
                v-for="p in fillTotalPages"
                :key="p"
                type="button"
                class="h-7 w-7 rounded-lg text-[11px] font-bold"
                :class="p === fillPage ? 'bg-[#e30613] text-white' : 'hover:bg-gray-100'"
                @click="fillPage = p"
              >{{ p }}</button>
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="fillPage === fillTotalPages" @click="fillPage++"><ChevronRight :size="14" /></button>
            </div>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">4 Yıllık Dolum Durumu</h3>
            <div class="mt-4 flex justify-center">
              <div class="relative flex h-32 w-32 items-center justify-center rounded-full" :style="fillDonutStyle">
                <div class="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center">
                  <span class="text-xl font-extrabold text-[#12204b]">%{{ fillTabStats.pct }}</span>
                  <span class="text-[10px] text-gray-400">Tamamlandı</span>
                </div>
              </div>
            </div>
            <div class="mt-4 space-y-1.5 text-xs">
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Dolum Yapılan</span><span class="font-bold">{{ fillTabStats.yapildi }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Dolum Bekleyen</span><span class="font-bold">{{ fillTabStats.bekliyor }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-red-500"></span>Süresi Geçen</span><span class="font-bold">{{ fillTabStats.gecti }}</span></div>
              <div class="flex items-center justify-between border-t border-gray-100 pt-1.5"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-gray-300"></span>Toplam</span><span class="font-bold">{{ fillTabStats.total }}</span></div>
            </div>
          </div>

          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">Tip Bazında Durum</h3>
            <div class="mt-3 space-y-3">
              <div v-for="t in fillTypeBreakdown" :key="t.type">
                <div class="mb-1 flex items-center justify-between text-xs"><span class="text-gray-600">{{ t.type }}</span><span class="font-semibold text-gray-500">{{ t.done }} / {{ t.total }}</span></div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full bg-emerald-500" :style="{ width: `${t.total ? (t.done / t.total) * 100 : 0}%` }" /></div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-blue-100 bg-[#eff6ff] p-4 text-xs text-[#1d4ed8]">
            <Wrench :size="16" class="mb-1.5" />
            <span class="font-semibold">4 Yıllık Dolum Planı</span> — süresi yaklaşan/geçen YSC'leri önceliklendirerek planlayın.
          </div>
        </aside>
      </section>

      <!-- Kontrol Geçmişi: tüm kontrol tiplerini (aylık/yıllık/4 yıllık) tek
           listede birleştiren gerçek-veri akışı, tarih aralığı + tip + konum +
           durum filtreleri, sağda dağılım donut'u + son kontroller listesi. -->
      <section v-else-if="activeTab === 'history'" class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div class="overflow-hidden rounded-xl border border-[#e5e9ef] bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div class="grid grid-cols-1 gap-3 border-b border-[#edf0f3] p-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label class="mb-1 block text-[11px] font-semibold text-[#64748b]">Tarih Aralığı</label>
              <div class="flex items-center gap-1.5">
                <input v-model="historyDateFrom" type="date" class="h-11 w-full rounded-lg border border-gray-200 px-2 text-xs" />
                <input v-model="historyDateTo" type="date" class="h-11 w-full rounded-lg border border-gray-200 px-2 text-xs" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-semibold text-[#64748b]">YSC Tipi</label>
              <select v-model="historyTypeFilter" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm">
                <option value="">Tümü</option>
                <option v-for="t in historyControlTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-semibold text-[#64748b]">Konum</label>
              <select v-model="historyLocationFilter" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm">
                <option value="">Tümü</option>
                <option v-for="loc in historyLocations" :key="loc" :value="loc">{{ loc }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-semibold text-[#64748b]">Durum</label>
              <select v-model="historyStatusFilter" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm">
                <option value="">Tümü</option>
                <option value="uygun">Uygun</option>
                <option value="uygunsuz">Uygunsuz</option>
                <option value="takipte">Takipte</option>
              </select>
            </div>
          </div>
          <div class="flex flex-col gap-3 border-b border-[#edf0f3] p-4 xl:flex-row xl:items-center">
            <div class="relative flex-1"><Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#d71920]" /><input v-model="historySearch" class="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-[#d71920]" placeholder="YSC kodu, konum, kontrol eden..." /></div>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold"><SlidersHorizontal :size="15" class="mr-2 inline" />Filtrele</button>
            <button class="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold" @click="exportHistoryExcel"><Download :size="15" class="mr-2 inline" />Excel'e Aktar</button>
          </div>
          <div v-if="loading" class="p-12 text-center text-sm text-gray-500">YSC kayıtları yükleniyor...</div>
          <div v-else-if="!historyFilteredRows.length" class="p-12 text-center text-sm text-gray-500">Bu filtreye uygun kayıt bulunamadı.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-[1150px] w-full text-left">
              <thead>
                <tr class="bg-[#f8fafc] text-[11px] font-bold text-[#64748b]">
                  <th class="w-10 px-4 py-3"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="historyAllSelected" @change="toggleHistorySelectAll"></th>
                  <th class="px-3 py-3">Tarih</th>
                  <th class="px-3 py-3">YSC Kodu</th>
                  <th class="px-3 py-3">Tip / Kapasite</th>
                  <th class="px-3 py-3">Konum</th>
                  <th class="px-3 py-3">Kontrol Türü</th>
                  <th class="px-3 py-3">Kontrol Eden</th>
                  <th class="px-3 py-3">Durum</th>
                  <th class="px-3 py-3">Not</th>
                  <th class="px-3 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in historyPagedRows" :key="row.id" class="border-t border-[#edf0f3] hover:bg-[#fffafa]">
                  <td class="px-4 py-2"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="historySelectedIds.has(row.id)" @change="toggleHistorySelected(row.id)"></td>
                  <td class="px-3 py-3 text-xs">{{ formatDate(row.date) }}</td>
                  <td class="px-3 py-3 text-sm font-bold text-[#17367d]">{{ row.item.code || `YSC-${row.item.id}` }}</td>
                  <td class="px-3 py-3 text-xs font-medium">{{ equipmentLabel(row.item) }}</td>
                  <td class="px-3 py-3 text-xs">{{ row.item.location_note || '—' }}</td>
                  <td class="px-3 py-3 text-xs">{{ row.controlType }}</td>
                  <td class="px-3 py-3 text-xs">{{ row.inspector }}</td>
                  <td class="px-3 py-3"><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="historyStatusMeta[row.result].cls">{{ historyStatusMeta[row.result].label }}</span></td>
                  <td class="px-3 py-3 text-xs text-gray-500">{{ row.note || '—' }}</td>
                  <td class="px-3 py-3">
                    <div class="flex items-center gap-1">
                      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100" @click="selectItem(row.item)"><Eye :size="15" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex flex-col items-center justify-between gap-2 border-t border-[#edf0f3] px-4 py-3 text-xs text-[#64748b] sm:flex-row">
            <span>{{ historyPagedRows.length }} kayıt gösteriliyor. Toplam {{ historyFilteredRows.length }} kayıt.</span>
            <div v-if="historyTotalPages > 1" class="flex items-center gap-1">
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="historyPage === 1" @click="historyPage--"><ChevronRight :size="14" class="rotate-180" /></button>
              <button
                v-for="p in historyTotalPages"
                :key="p"
                type="button"
                class="h-7 w-7 rounded-lg text-[11px] font-bold"
                :class="p === historyPage ? 'bg-[#e30613] text-white' : 'hover:bg-gray-100'"
                @click="historyPage = p"
              >{{ p }}</button>
              <button type="button" class="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-40" :disabled="historyPage === historyTotalPages" @click="historyPage++"><ChevronRight :size="14" /></button>
            </div>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">Kontrol Dağılımı</h3>
            <div class="mt-4 flex justify-center">
              <div class="relative flex h-32 w-32 items-center justify-center rounded-full" :style="historyDonutStyle">
                <div class="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center">
                  <span class="text-xl font-extrabold text-[#12204b]">{{ historyStats.total }}</span>
                  <span class="text-[10px] text-gray-400">Toplam Kayıt</span>
                </div>
              </div>
            </div>
            <div class="mt-4 space-y-1.5 text-xs">
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Uygun</span><span class="font-bold">{{ historyStats.uygun }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-red-500"></span>Uygunsuz</span><span class="font-bold">{{ historyStats.uygunsuz }}</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-1.5 text-gray-600"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Takipte</span><span class="font-bold">{{ historyStats.takipte }}</span></div>
            </div>
          </div>

          <div class="rounded-xl border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)]">
            <h3 class="text-sm font-bold text-[#12204b]">Son Kontroller</h3>
            <div class="mt-3 space-y-3">
              <div v-for="row in recentHistoryRows" :key="row.id" class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50"><img src="/images/fire-extinguisher.svg" class="h-8 w-6 object-contain" /></div>
                  <div><div class="text-xs font-bold text-[#17367d]">{{ row.item.code || `YSC-${row.item.id}` }}</div><div class="text-[11px] text-gray-400">{{ formatDate(row.date) }}</div></div>
                </div>
                <span class="rounded-full px-2 py-1 text-[10px] font-semibold" :class="historyStatusMeta[row.result].cls">{{ historyStatusMeta[row.result].label }}</span>
              </div>
              <div v-if="!recentHistoryRows.length" class="py-4 text-center text-xs text-gray-400">Henüz kontrol kaydı yok.</div>
            </div>
            <button type="button" class="mt-3 text-xs font-bold text-[#d71920]" @click="historyPage = 1">Tüm Geçmişi Gör →</button>
          </div>
        </aside>
      </section>

      <div v-if="activeTab === 'monthly'" class="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#e30613] text-white"><Flame :size="25" /></div>
          <div><div class="text-lg font-extrabold text-[#e30613]">Yangın güvenliği, güvenli hizmet demektir.</div><div class="text-sm text-[#64748b]">Aylık kontrolleri zamanında tamamlayarak riskleri en aza indirin.</div></div>
        </div>
        <button type="button" class="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-[#e30613]"><CalendarDays :size="16" />Kontrol Takvimi</button>
      </div>
      <div v-else-if="activeTab === 'annual'" class="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#e30613] text-white"><Flame :size="25" /></div>
          <div><div class="text-lg font-extrabold text-[#e30613]">Yangın güvenliği, düzenli bakım ile süreklilik kazanır.</div><div class="text-sm text-[#64748b]">Yıllık bakımların zamanında yapılması olası riskleri en aza indirir.</div></div>
        </div>
        <button type="button" class="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-[#e30613]"><CalendarDays :size="16" />Yıllık Bakım Takvimi</button>
      </div>
      <div v-else-if="activeTab === 'fill'" class="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#e30613] text-white"><Flame :size="25" /></div>
          <div><div class="text-lg font-extrabold text-[#e30613]">Süresi geçen {{ fillTabStats.gecti }} yangın söndürücü bulunmaktadır.</div><div class="text-sm text-[#64748b]">4 yıllık dolum süresi geçen YSC'leri en kısa sürede doldurarak riskleri en aza indirin.</div></div>
        </div>
        <button type="button" class="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-[#e30613]"><Wrench :size="16" />Dolum Planı Oluştur</button>
      </div>
      <div v-else-if="activeTab === 'history'" class="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#e30613] text-white"><Flame :size="25" /></div>
          <div><div class="text-lg font-extrabold text-[#e30613]">Düzenli kontrol, güvenli iş yeri demektir.</div><div class="text-sm text-[#64748b]">Tüm kontrolleri zamanında yaparak yangın riskini en aza indirin.</div></div>
        </div>
        <button type="button" class="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-[#e30613]"><CalendarDays :size="16" />Kontrol Takvimi</button>
      </div>
      <div v-else class="mt-4 flex items-center gap-4 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#e30613] text-white"><Flame :size="25" /></div><div><div class="text-lg font-extrabold text-[#e30613]">Yangın güvenliği, güvenli lezzet demektir.</div><div class="text-sm text-[#64748b]">Düzenli kontrol, güvenli yarınlar. Olivium Burger.</div></div></div>
    </main>
  </div>
</template>