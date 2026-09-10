<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Clock, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, X } from '@lucide/vue'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import { emergencyEquipmentTypeApi } from '~/api/emergency-equipment-type'
import type { EmergencyEquipmentType } from '~/types/emergency-equipment'
import type { LocationEmergencyEquipmentItem, LocationEmergencyEquipmentPeriodicStatus } from '~/types/location-emergency-equipment'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const items = ref<LocationEmergencyEquipmentItem[]>([])
const types = ref<EmergencyEquipmentType[]>([])
const loading = ref(false)

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

const leafTypes = computed(() => types.value.filter(t => !t.children_count))

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

// Aylık kontrol durumu backend'de ayrı bir accessor olarak yok (sadece
// dashboard servisinde iç hesap) — burada aynı mantıkla (son denetim/kurulum
// tarihi + tipin kontrol sıklığı, 30 günlük "yaklaşıyor" penceresi) frontend
// tarafında türetiliyor; backend'e dokunulmadı.
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

const worstStatus = (item: LocationEmergencyEquipmentItem): LocationEmergencyEquipmentPeriodicStatus | null => {
  const all = [monthlyStatus(item), item.annual_control_status ?? null, item.fill_status ?? null].filter(Boolean) as LocationEmergencyEquipmentPeriodicStatus[]
  if (all.includes('gecikmis')) return 'gecikmis'
  if (all.includes('yaklasiyor')) return 'yaklasiyor'
  if (all.length) return 'guncel'
  return null
}

const periodicMeta = (status: LocationEmergencyEquipmentPeriodicStatus | null) => ({
  gecikmis: { label: 'Gecikmiş', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' },
  yaklasiyor: { label: 'Yaklaşıyor', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  guncel: { label: 'Güncel', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
}[status ?? ''] ?? { label: 'Kontrol Yok', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' })

const activeCount = computed(() => items.value.filter(i => i.is_active).length)
const yaklasanCount = computed(() => items.value.filter(i => worstStatus(i) === 'yaklasiyor').length)
const gecikmisCount = computed(() => items.value.filter(i => worstStatus(i) === 'gecikmis').length)

// --- Filtreler ---
const searchQuery = ref('')
const typeFilter = ref<number | ''>('')
const statusFilter = ref<'' | LocationEmergencyEquipmentPeriodicStatus>('')
const locationFilter = ref('')

const distinctLocations = computed(() =>
  [...new Set(items.value.map(i => i.location_note).filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, 'tr')),
)
const hasActiveFilters = computed(() => !!(searchQuery.value || typeFilter.value || statusFilter.value || locationFilter.value))
const clearFilters = () => { searchQuery.value = ''; typeFilter.value = ''; statusFilter.value = ''; locationFilter.value = '' }

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase('tr-TR')
  return items.value.filter((item) => {
    if (typeFilter.value && item.equipment_type_id !== typeFilter.value) return false
    if (statusFilter.value && worstStatus(item) !== statusFilter.value) return false
    if (locationFilter.value && item.location_note !== locationFilter.value) return false
    if (q) {
      const haystack = `${item.code ?? ''} ${item.equipment_type?.tip ?? ''} ${item.location_note ?? ''}`.toLocaleLowerCase('tr-TR')
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

// --- Ekle / Düzenle ---
const drawerOpen = ref(false)
const editingItem = ref<LocationEmergencyEquipmentItem | null>(null)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const form = ref({
  equipment_type_id: 0,
  code: '',
  location_note: '',
  install_date: '',
  is_active: true,
  last_fill_date: '',
  next_fill_date: '',
  last_annual_maintenance_date: '',
  next_annual_maintenance_date: '',
  service_company: '',
})

const openCreate = () => {
  editingItem.value = null
  form.value = {
    equipment_type_id: leafTypes.value[0]?.id ?? 0,
    code: '',
    location_note: '',
    install_date: '',
    is_active: true,
    last_fill_date: '',
    next_fill_date: '',
    last_annual_maintenance_date: '',
    next_annual_maintenance_date: '',
    service_company: '',
  }
  drawerOpen.value = true
}
const openEdit = (item: LocationEmergencyEquipmentItem) => {
  editingItem.value = item
  form.value = {
    equipment_type_id: item.equipment_type_id,
    code: item.code ?? '',
    location_note: item.location_note ?? '',
    install_date: item.install_date?.slice(0, 10) ?? '',
    is_active: item.is_active,
    last_fill_date: item.last_fill_date?.slice(0, 10) ?? '',
    next_fill_date: item.next_fill_date?.slice(0, 10) ?? '',
    last_annual_maintenance_date: item.last_annual_maintenance_date?.slice(0, 10) ?? '',
    next_annual_maintenance_date: item.next_annual_maintenance_date?.slice(0, 10) ?? '',
    service_company: item.service_company ?? '',
  }
  drawerOpen.value = true
}
const closeDrawer = () => { drawerOpen.value = false }

const submitForm = async () => {
  if (!context.branchId || saving.value) return
  saving.value = true
  try {
    const payload = {
      equipment_type_id: form.value.equipment_type_id,
      code: form.value.code || null,
      location_note: form.value.location_note || null,
      install_date: form.value.install_date || null,
      is_active: form.value.is_active,
      last_fill_date: form.value.last_fill_date || null,
      next_fill_date: form.value.next_fill_date || null,
      last_annual_maintenance_date: form.value.last_annual_maintenance_date || null,
      next_annual_maintenance_date: form.value.next_annual_maintenance_date || null,
      service_company: form.value.service_company || null,
    }
    if (editingItem.value) {
      await locationEmergencyEquipmentApi.update(editingItem.value.id, payload)
      $toast.success('Ekipman güncellendi.')
    } else {
      await locationEmergencyEquipmentApi.create(context.branchId, payload)
      $toast.success('Ekipman eklendi.')
    }
    drawerOpen.value = false
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Kayıt işlemi başarısız oldu.')
  } finally {
    saving.value = false
  }
}

const removeItem = async (item: LocationEmergencyEquipmentItem) => {
  if (!window.confirm(`${item.code || 'Bu ekipmanı'} silmek istediğinize emin misiniz?`)) return
  deletingId.value = item.id
  try {
    await locationEmergencyEquipmentApi.remove(item.id)
    $toast.success('Ekipman silindi.')
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Ekipman silinemedi (denetim kaydı varsa pasife alın).')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1500px]">
          <YscTabs active="equipment" />

          <section class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d71920]">YSC</div>
              <h1 class="text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#111827] dark:text-white">Ekipmanlar</h1>
              <p class="mt-1.5 text-[15px] text-[#64748b] dark:text-gray-400">Taşınabilir yangın söndürme cihazları — aylık kontrol, yıllık bakım ve 4 yıllık dolum takibi.</p>
            </div>
            <button type="button" class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d71920] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(215,25,32,0.18)] transition hover:bg-[#b9151b]" @click="openCreate">
              <Plus :size="18" stroke-width="2.5" />
              YSC Ekle
            </button>
          </section>

          <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>

          <template v-else>
            <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><ShieldCheck :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Toplam Ekipman</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ items.length }}</p></div>
                </div>
              </div>
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Aktif</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ activeCount }}</p></div>
                </div>
              </div>
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10"><Clock :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Kontrol Yaklaşıyor</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ yaklasanCount }}</p></div>
                </div>
              </div>
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><AlertTriangle :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Gecikmiş</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ gecikmisCount }}</p></div>
                </div>
              </div>
            </section>

            <section class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div class="relative flex-1 sm:max-w-xs">
                  <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input v-model="searchQuery" type="text" placeholder="Ekipman ara (kod, tip, konum...)" class="h-10 w-full rounded-lg border border-[#dfe3e8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                </div>
                <select v-model="typeFilter" class="h-10 rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  <option :value="''">Tüm Tipler</option>
                  <option v-for="t in leafTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <select v-model="statusFilter" class="h-10 rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Tüm Durumlar</option>
                  <option value="guncel">Güncel</option>
                  <option value="yaklasiyor">Yaklaşıyor</option>
                  <option value="gecikmis">Gecikmiş</option>
                </select>
                <select v-model="locationFilter" class="h-10 rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Tüm Lokasyonlar</option>
                  <option v-for="loc in distinctLocations" :key="loc" :value="loc">{{ loc }}</option>
                </select>
                <button v-if="hasActiveFilters" type="button" class="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5" @click="clearFilters">
                  <X :size="13" />Filtreleri Temizle
                </button>
              </div>
            </section>

            <section class="mt-4">
              <div v-if="!filteredItems.length" class="rounded-xl border border-dashed border-[#dfe3e8] bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
                <p class="text-sm font-semibold text-gray-500">{{ hasActiveFilters ? 'Filtrelere uyan kayıt yok.' : 'Henüz kayıt yok.' }}</p>
                <button type="button" class="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#d71920] px-4 py-2 text-xs font-semibold text-white" @click="openCreate">
                  <Plus :size="14" />Kayıt Ekle
                </button>
              </div>

              <div v-else class="overflow-x-auto rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                <table class="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr class="border-b border-[#f1f2f4] text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                      <th class="px-4 py-3">Kod</th>
                      <th class="px-4 py-3">Tip</th>
                      <th class="px-4 py-3">Kapasite</th>
                      <th class="px-4 py-3">Konum</th>
                      <th class="px-4 py-3">Aylık</th>
                      <th class="px-4 py-3">Yıllık</th>
                      <th class="px-4 py-3">4 Yıllık</th>
                      <th class="px-4 py-3">Durum</th>
                      <th class="px-4 py-3 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in filteredItems" :key="item.id" class="border-b border-[#f1f2f4] last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <td class="px-4 py-3 font-semibold text-[#172033] dark:text-white">{{ item.code || '—' }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.equipment_type?.tip || item.equipment_type?.name || '—' }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.equipment_type?.capacity_kg ? `${item.equipment_type.capacity_kg} KG` : '—' }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.location_note || '—' }}</td>
                      <td class="px-4 py-3"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="periodicMeta(monthlyStatus(item)).cls">{{ periodicMeta(monthlyStatus(item)).label }}</span></td>
                      <td class="px-4 py-3"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="periodicMeta(item.annual_control_status ?? null).cls">{{ periodicMeta(item.annual_control_status ?? null).label }}</span></td>
                      <td class="px-4 py-3"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="periodicMeta(item.fill_status ?? null).cls">{{ periodicMeta(item.fill_status ?? null).label }}</span></td>
                      <td class="px-4 py-3"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="periodicMeta(worstStatus(item)).cls">{{ item.is_active ? periodicMeta(worstStatus(item)).label : 'Pasif' }}</span></td>
                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-1">
                          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="openEdit(item)"><Pencil :size="13" /></button>
                          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#d71920] dark:hover:bg-red-500/10" :disabled="deletingId === item.id" @click="removeItem(item)">
                            <LoaderCircle v-if="deletingId === item.id" :size="13" class="animate-spin" />
                            <Trash2 v-else :size="13" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="mt-2 text-xs text-gray-400">Toplam {{ filteredItems.length }} kayıt</p>
            </section>
          </template>
        </div>
      </main>
    </div>

    <!-- Ekle/Düzenle drawer -->
    <div v-if="drawerOpen" class="fixed inset-0 z-[10000] flex justify-end bg-black/30" @click.self="closeDrawer">
      <div class="flex h-full w-full max-w-md flex-col bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p class="text-sm font-bold text-[#172033] dark:text-white">{{ editingItem ? 'Kaydı Düzenle' : 'Yeni YSC Ekle' }}</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeDrawer"><X :size="16" /></button>
        </div>
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Ekipman Tipi</label>
            <select v-model.number="form.equipment_type_id" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option v-for="t in leafTypes" :key="t.id" :value="t.id">{{ t.name }}{{ t.capacity_kg ? ` — ${t.capacity_kg} KG` : '' }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Ekipman Kodu</label>
            <input v-model="form.code" type="text" placeholder="Örn. YSC-001" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Konum Notu</label>
            <input v-model="form.location_note" type="text" placeholder="Örn. Zemin Kat" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kurulum Tarihi</label>
            <input v-model="form.install_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Son Dolum</label>
              <input v-model="form.last_fill_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Sonraki Dolum</label>
              <input v-model="form.next_fill_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Son Yıllık Bakım</label>
              <input v-model="form.last_annual_maintenance_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Sonraki Yıllık Bakım</label>
              <input v-model="form.next_annual_maintenance_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Servis Firması</label>
            <input v-model="form.service_company" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input v-model="form.is_active" type="checkbox">
            Aktif
          </label>
        </div>
        <div class="flex gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="saving" @click="closeDrawer">Vazgeç</button>
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="saving || !form.equipment_type_id" @click="submitForm">
            <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
