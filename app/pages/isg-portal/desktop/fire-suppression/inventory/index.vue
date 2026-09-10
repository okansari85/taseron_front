<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Droplets,
  Flame,
  Gauge,
  LayoutGrid,
  List,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Waves,
  X,
  XCircle,
} from '@lucide/vue'
import { fireSuppressionInventoryApi } from '~/api/fire-suppression-inventory'
import {
  FIRE_SUPPRESSION_CATEGORIES,
  FIRE_SUPPRESSION_CATEGORY_LABELS,
  type FireSuppressionCategory,
  type FireSuppressionInventoryItem,
  type FireSuppressionInventorySummary,
} from '~/types/fire-suppression-inventory'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const items = ref<FireSuppressionInventoryItem[]>([])
const summary = ref<FireSuppressionInventorySummary | null>(null)
const loading = ref(false)
const selectedCategory = ref<FireSuppressionCategory | null>(null)
const viewMode = ref<'card' | 'list'>('list')
const searchQuery = ref('')
const statusFilter = ref<'' | 'kontrolu_gecerli' | 'kontrol_yaklasiyor' | 'kontrol_gecikmis'>('')
const locationFilter = ref('')

const categoryIcons: Record<FireSuppressionCategory, any> = {
  yangin_dolabi: Building2,
  sprinkler: Droplets,
  hidrant: Waves,
  yangin_pompasi: Gauge,
  su_deposu: Waves,
  gazli_sondurme: Flame,
  diger: Building2,
}

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const [listRes, summaryRes] = await Promise.all([
      fireSuppressionInventoryApi.list(context.branchId),
      fireSuppressionInventoryApi.summary(context.branchId),
    ])
    items.value = listRes.data
    summary.value = summaryRes.data
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

watch(() => context.branchId, () => {
  selectedCategory.value = null
  searchQuery.value = ''
  statusFilter.value = ''
  locationFilter.value = ''
  load()
})

const categoryCounts = computed(() => {
  const map = new Map(FIRE_SUPPRESSION_CATEGORIES.map(c => [c, { total: 0, nonconformity_count: 0 }]))
  summary.value?.categories.forEach((row) => { map.set(row.category, { total: row.total, nonconformity_count: row.nonconformity_count }) })
  return map
})

const distinctLocations = computed(() =>
  [...new Set(items.value.map(i => i.location_note).filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, 'tr')),
)

const activeCount = computed(() => items.value.filter(i => i.is_active).length)
const passiveCount = computed(() => items.value.length - activeCount.value)

const clearFilters = () => {
  selectedCategory.value = null
  searchQuery.value = ''
  statusFilter.value = ''
  locationFilter.value = ''
}

const hasActiveFilters = computed(() => !!(selectedCategory.value || searchQuery.value || statusFilter.value || locationFilter.value))

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase('tr-TR')
  return items.value.filter((item) => {
    if (selectedCategory.value && item.category !== selectedCategory.value) return false
    if (statusFilter.value && item.periodic_control_status !== statusFilter.value) return false
    if (locationFilter.value && item.location_note !== locationFilter.value) return false
    if (q) {
      const haystack = `${item.code ?? ''} ${FIRE_SUPPRESSION_CATEGORY_LABELS[item.category]} ${item.location_note ?? ''}`.toLocaleLowerCase('tr-TR')
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

const periodicStatusMeta = (status?: string | null) => ({
  kontrolu_gecerli: { label: 'Kontrolü Geçerli', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  kontrol_yaklasiyor: { label: 'Kontrol Yaklaşıyor', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  kontrol_gecikmis: { label: 'Kontrol Gecikmiş', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' },
}[status ?? ''] ?? { label: 'Kontrol Yapılmadı', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' })

const complianceMeta = (status?: string | null) => status === 'uygun'
  ? { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  : status === 'uygun_degil'
    ? { label: 'Uygun Değil', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' }
    : { label: 'Belirsiz', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }

// --- Ekle / Düzenle ---
const drawerOpen = ref(false)
const editingItem = ref<FireSuppressionInventoryItem | null>(null)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const form = ref({
  category: 'yangin_dolabi' as FireSuppressionCategory,
  code: '',
  location_note: '',
  last_control_date: '',
  next_control_date: '',
  compliance_status: '' as '' | 'uygun' | 'uygun_degil',
  open_nonconformity_count: 0,
  notes: '',
})

const openCreate = () => {
  editingItem.value = null
  form.value = {
    category: selectedCategory.value ?? 'yangin_dolabi',
    code: '',
    location_note: '',
    last_control_date: '',
    next_control_date: '',
    compliance_status: '',
    open_nonconformity_count: 0,
    notes: '',
  }
  drawerOpen.value = true
}

const openEdit = (item: FireSuppressionInventoryItem) => {
  editingItem.value = item
  form.value = {
    category: item.category,
    code: item.code ?? '',
    location_note: item.location_note ?? '',
    last_control_date: item.last_control_date ? item.last_control_date.slice(0, 10) : '',
    next_control_date: item.next_control_date ? item.next_control_date.slice(0, 10) : '',
    compliance_status: item.compliance_status ?? '',
    open_nonconformity_count: item.open_nonconformity_count,
    notes: item.notes ?? '',
  }
  drawerOpen.value = true
}

const closeDrawer = () => { drawerOpen.value = false }

const submitForm = async () => {
  if (!context.branchId || saving.value) return
  saving.value = true
  try {
    const payload = {
      category: form.value.category,
      code: form.value.code || null,
      location_note: form.value.location_note || null,
      last_control_date: form.value.last_control_date || null,
      next_control_date: form.value.next_control_date || null,
      compliance_status: form.value.compliance_status || null,
      open_nonconformity_count: form.value.open_nonconformity_count,
      notes: form.value.notes || null,
    }
    if (editingItem.value) {
      await fireSuppressionInventoryApi.update(editingItem.value.id, payload)
      $toast.success('Envanter kaydı güncellendi.')
    } else {
      await fireSuppressionInventoryApi.create(context.branchId, payload)
      $toast.success('Envanter kaydı eklendi.')
    }
    drawerOpen.value = false
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Kayıt işlemi başarısız oldu.')
  } finally {
    saving.value = false
  }
}

const removeItem = async (item: FireSuppressionInventoryItem) => {
  if (!window.confirm(`${item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category]} kaydını silmek istediğinize emin misiniz?`)) return
  deletingId.value = item.id
  try {
    await fireSuppressionInventoryApi.remove(item.id)
    $toast.success('Envanter kaydı silindi.')
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Kayıt silinemedi.')
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
          <section class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d71920]">Yangın Söndürme Sistemleri</div>
              <h1 class="text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#111827] dark:text-white">Envanter</h1>
              <p class="mt-1.5 text-[15px] text-[#64748b] dark:text-gray-400">Lokasyondaki sabit yangın söndürme tesisatının kalıcı kaydı.</p>
            </div>
            <button type="button" class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d71920] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(215,25,32,0.18)] transition hover:bg-[#b9151b]" @click="openCreate">
              <Plus :size="18" stroke-width="2.5" />
              Yeni Ekle
            </button>
          </section>

          <div v-if="loading && !summary" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>

          <template v-else>
            <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><Flame :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Toplam Sistem</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ items.length }}</p></div>
                </div>
              </div>

              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 :size="22" /></span>
                  <div>
                    <p class="text-sm font-medium text-[#64748b]">Aktif</p>
                    <p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ activeCount }}</p>
                    <p class="mt-0.5 text-xs text-gray-400">%{{ items.length ? Math.round((activeCount / items.length) * 100) : 0 }}</p>
                  </div>
                </div>
              </div>

              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10"><XCircle :size="22" /></span>
                  <div>
                    <p class="text-sm font-medium text-[#64748b]">Pasif</p>
                    <p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ passiveCount }}</p>
                    <p class="mt-0.5 text-xs text-gray-400">%{{ items.length ? Math.round((passiveCount / items.length) * 100) : 0 }}</p>
                  </div>
                </div>
              </div>

              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><AlertTriangle :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Toplam Uygunsuzluk</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ summary?.total_nonconformity ?? 0 }}</p></div>
                </div>
              </div>
            </section>

            <section class="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                :class="!selectedCategory ? 'bg-[#d71920] text-white' : 'bg-white text-gray-600 border border-[#e7e9ed] hover:border-[#d71920]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'"
                @click="selectedCategory = null"
              >
                Tümü ({{ items.length }})
              </button>
              <button
                v-for="category in FIRE_SUPPRESSION_CATEGORIES"
                :key="category"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                :class="selectedCategory === category ? 'bg-[#d71920] text-white' : 'bg-white text-gray-600 border border-[#e7e9ed] hover:border-[#d71920]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'"
                @click="selectedCategory = category"
              >
                <component :is="categoryIcons[category]" :size="13" />
                {{ FIRE_SUPPRESSION_CATEGORY_LABELS[category] }} ({{ categoryCounts.get(category)?.total ?? 0 }})
                <span v-if="(categoryCounts.get(category)?.nonconformity_count ?? 0) > 0" class="rounded-full px-1.5 text-[10px]" :class="selectedCategory === category ? 'bg-white/20' : 'bg-red-50 text-[#d71920] dark:bg-red-500/10'">{{ categoryCounts.get(category)?.nonconformity_count }}</span>
              </button>
            </section>

            <section class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div class="relative flex-1 sm:max-w-xs">
                  <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input v-model="searchQuery" type="text" placeholder="Sistem adı, kodu veya konum ara..." class="h-10 w-full rounded-lg border border-[#dfe3e8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                </div>
                <select v-model="statusFilter" class="h-10 rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Durum: Tümü</option>
                  <option value="kontrolu_gecerli">Kontrolü Geçerli</option>
                  <option value="kontrol_yaklasiyor">Kontrol Yaklaşıyor</option>
                  <option value="kontrol_gecikmis">Kontrol Gecikmiş</option>
                </select>
                <select v-model="locationFilter" class="h-10 rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Konum: Tümü</option>
                  <option v-for="loc in distinctLocations" :key="loc" :value="loc">{{ loc }}</option>
                </select>
                <button v-if="hasActiveFilters" type="button" class="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5" @click="clearFilters">
                  <X :size="13" />Filtreleri Temizle
                </button>
              </div>
              <div class="inline-flex shrink-0 rounded-lg border border-[#e7e9ed] bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
                <button type="button" class="flex h-8 w-8 items-center justify-center rounded-md" :class="viewMode === 'card' ? 'bg-[#d71920] text-white' : 'text-gray-400'" @click="viewMode = 'card'"><LayoutGrid :size="15" /></button>
                <button type="button" class="flex h-8 w-8 items-center justify-center rounded-md" :class="viewMode === 'list' ? 'bg-[#d71920] text-white' : 'text-gray-400'" @click="viewMode = 'list'"><List :size="15" /></button>
              </div>
            </section>

            <section class="mt-4">
              <div v-if="!filteredItems.length" class="rounded-xl border border-dashed border-[#dfe3e8] bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
                <p class="text-sm font-semibold text-gray-500">{{ hasActiveFilters ? 'Filtrelere uyan kayıt yok.' : 'Henüz kayıt yok.' }}</p>
                <button type="button" class="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#d71920] px-4 py-2 text-xs font-semibold text-white" @click="openCreate">
                  <Plus :size="14" />Kayıt Ekle
                </button>
              </div>

              <div v-else-if="viewMode === 'card'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div v-for="item in filteredItems" :key="item.id" class="rounded-xl border border-[#e7e9ed] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-bold text-[#172033] dark:text-white">{{ item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}</p>
                      <p class="truncate text-xs text-gray-400">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }} · {{ item.location_note || '—' }}</p>
                    </div>
                    <div class="flex shrink-0 items-center gap-1">
                      <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="openEdit(item)"><Pencil :size="13" /></button>
                      <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#d71920] dark:hover:bg-red-500/10" :disabled="deletingId === item.id" @click="removeItem(item)">
                        <LoaderCircle v-if="deletingId === item.id" :size="13" class="animate-spin" />
                        <Trash2 v-else :size="13" />
                      </button>
                    </div>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-1.5">
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="periodicStatusMeta(item.periodic_control_status).cls">{{ periodicStatusMeta(item.periodic_control_status).label }}</span>
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="complianceMeta(item.compliance_status).cls">{{ complianceMeta(item.compliance_status).label }}</span>
                    <span v-if="item.open_nonconformity_count > 0" class="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-[#d71920] dark:bg-red-500/10 dark:text-red-400">{{ item.open_nonconformity_count }} uygunsuzluk</span>
                  </div>

                  <dl class="mt-3 space-y-1.5 border-t border-[#f1f2f4] pt-3 text-xs dark:border-gray-800">
                    <div class="flex justify-between"><dt class="text-gray-400">Son Kontrol</dt><dd class="font-medium text-gray-600 dark:text-gray-300">{{ formatDate(item.last_control_date) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-gray-400">Sonraki Kontrol</dt><dd class="font-medium text-gray-600 dark:text-gray-300">{{ formatDate(item.next_control_date) }}</dd></div>
                  </dl>
                </div>
              </div>

              <div v-else class="overflow-x-auto rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                <table class="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr class="border-b border-[#f1f2f4] text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                      <th class="px-4 py-3">Ekipman Kodu</th>
                      <th class="px-4 py-3">Tür</th>
                      <th class="px-4 py-3">Marka / Model</th>
                      <th class="px-4 py-3">Konum</th>
                      <th class="px-4 py-3">Son Kontrol</th>
                      <th class="px-4 py-3">Kontrol Durumu</th>
                      <th class="px-4 py-3">Uygunsuzluk</th>
                      <th class="px-4 py-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in filteredItems" :key="item.id" class="border-b border-[#f1f2f4] last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <td class="px-4 py-3 font-semibold text-[#172033] dark:text-white">{{ item.code || '—' }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ [item.brand, item.model].filter(Boolean).join(' / ') || '—' }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.location_note || '—' }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ formatDate(item.last_control_date) }}</td>
                      <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="periodicStatusMeta(item.periodic_control_status).cls">{{ periodicStatusMeta(item.periodic_control_status).label }}</span></td>
                      <td class="px-4 py-3">
                        <span v-if="item.open_nonconformity_count > 0" class="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-[#d71920] dark:bg-red-500/10 dark:text-red-400">{{ item.open_nonconformity_count }}</span>
                        <span v-else class="text-xs text-gray-400">0</span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-1.5">
                          <NuxtLink :to="`/isg-portal/desktop/fire-suppression/inventory/${item.id}`" class="rounded-lg border border-[#dfe3e8] px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Detay</NuxtLink>
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
            </section>
          </template>
        </div>
      </main>
    </div>

    <!-- Ekle/Düzenle drawer -->
    <div v-if="drawerOpen" class="fixed inset-0 z-[10000] flex justify-end bg-black/30" @click.self="closeDrawer">
      <div class="flex h-full w-full max-w-md flex-col bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p class="text-sm font-bold text-[#172033] dark:text-white">{{ editingItem ? 'Kaydı Düzenle' : 'Yeni Envanter Kaydı' }}</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeDrawer"><X :size="16" /></button>
        </div>
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kategori</label>
            <select v-model="form.category" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" :value="c">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Ekipman Kodu</label>
            <input v-model="form.code" type="text" placeholder="Örn. YD-001" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Konum Notu</label>
            <input v-model="form.location_note" type="text" placeholder="Örn. Zemin Kat" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Son Kontrol</label>
              <input v-model="form.last_control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Sonraki Kontrol</label>
              <input v-model="form.next_control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Tesisat Uygunluğu</label>
            <select v-model="form.compliance_status" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option value="">Belirsiz</option>
              <option value="uygun">Uygun</option>
              <option value="uygun_degil">Uygun Değil</option>
            </select>
          </div>
          <div v-if="form.compliance_status === 'uygun_degil'">
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Uygunsuzluk Sayısı</label>
            <input v-model.number="form.open_nonconformity_count" type="number" min="0" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Notlar</label>
            <textarea v-model="form.notes" rows="3" class="w-full rounded-lg border border-[#dfe3e8] bg-white p-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800" />
          </div>
        </div>
        <div class="flex gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="saving" @click="closeDrawer">Vazgeç</button>
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="saving" @click="submitForm">
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
