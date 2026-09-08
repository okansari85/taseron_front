<script setup lang="ts">
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Eye, Filter, Plus, RefreshCw, Search, ShieldAlert } from '@lucide/vue'
import { fieldFindingApi } from '~/api/field-finding'
import type { FieldFindingRecord, FieldFindingSeverity, FieldFindingStatus } from '~/types/field-finding'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const findings = ref<FieldFindingRecord[]>([])
const loading = ref(false)
const search = ref('')
const statusFilter = ref<'all' | FieldFindingStatus>('all')
const severityFilter = ref<'all' | FieldFindingSeverity>('all')
const categoryFilter = ref<'all' | FieldFindingRecord['category']>('all')
const page = ref(1)
const pageSize = 5

const categoryLabels: Record<FieldFindingRecord['category'], string> = {
  yangin_guvenligi: 'Yangın Güvenliği',
  acil_cikis: 'Acil Çıkış',
  yangin_kapisi: 'Yangın Kapısı',
  kacis_yolu: 'Kaçış Yolu',
  diger: 'Diğer',
}

const severityLabels: Record<FieldFindingSeverity, string> = {
  dusuk: 'Düşük',
  orta: 'Orta',
  yuksek: 'Yüksek',
  kritik: 'Kritik',
}

const statusLabels: Record<FieldFindingStatus, string> = {
  open: 'Açık',
  closed: 'Kapalı',
}

const loadFindings = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const response = await fieldFindingApi.list(context.branchId)
    findings.value = response.data ?? []
    page.value = 1
  } finally {
    loading.value = false
  }
}

const filteredFindings = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return findings.value.filter((finding) => {
    const matchesSearch = !term || [
      finding.description,
      finding.location_note,
      finding.reported_by_user?.name,
      categoryLabels[finding.category],
    ].some(value => value?.toLocaleLowerCase('tr-TR').includes(term))
    const matchesStatus = statusFilter.value === 'all' || finding.status === statusFilter.value
    const matchesSeverity = severityFilter.value === 'all' || finding.severity === severityFilter.value
    const matchesCategory = categoryFilter.value === 'all' || finding.category === categoryFilter.value
    return matchesSearch && matchesStatus && matchesSeverity && matchesCategory
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredFindings.value.length / pageSize)))
const paginatedFindings = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredFindings.value.slice(start, start + pageSize)
})

const openCount = computed(() => findings.value.filter(item => item.status === 'open').length)
const criticalCount = computed(() => findings.value.filter(item => item.severity === 'kritik' && item.status === 'open').length)
const closedCount = computed(() => findings.value.filter(item => item.status === 'closed').length)

const severityClass = (severity: FieldFindingSeverity) => ({
  dusuk: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  orta: 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  yuksek: 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20',
  kritik: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
}[severity])

const statusClass = (status: FieldFindingStatus) => status === 'open'
  ? 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
  : 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'

const categoryClass = (category: FieldFindingRecord['category']) => ({
  yangin_guvenligi: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  acil_cikis: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  yangin_kapisi: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  kacis_yolu: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  diger: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}[category])

const formatDate = (value: string) => new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

const resetFilters = () => {
  search.value = ''
  statusFilter.value = 'all'
  severityFilter.value = 'all'
  categoryFilter.value = 'all'
  page.value = 1
}

const setPage = (nextPage: number) => {
  page.value = Math.min(Math.max(nextPage, 1), pageCount.value)
}

watch([search, statusFilter, severityFilter, categoryFilter], () => {
  page.value = 1
})

watch(pageCount, () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
    return
  }
  loadFindings()
})

watch(() => context.branchId, () => loadFindings())
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
              <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d71920]">Saha Bulguları</div>
              <h1 class="text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#111827] dark:text-white">Saha Bulguları</h1>
              <p class="mt-1.5 text-[15px] text-[#64748b] dark:text-gray-400">Sahada tespit edilen uygunsuzlukları, riskleri ve aksiyonları yönetin.</p>
            </div>
            <button type="button" class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d71920] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(215,25,32,0.18)] transition hover:bg-[#b9151b]">
              <Plus :size="18" stroke-width="2.5" />
              Yeni Bulgu
            </button>
          </section>

          <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><ClipboardList :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Toplam Bulgu</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ findings.length }}</p></div>
                </div>
                <svg viewBox="0 0 90 36" class="mt-4 h-9 w-24 text-red-500" fill="none" aria-hidden="true"><path d="M2 29C12 28 14 21 23 24C32 27 37 17 46 20C56 23 59 13 68 16C76 18 82 8 88 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              </div>
              <p class="mt-4 text-xs font-medium text-gray-400">Bu çalışma alanındaki kayıtlar</p>
            </div>

            <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><AlertTriangle :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Açık Bulgular</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ openCount }}</p></div>
                </div>
                <svg viewBox="0 0 90 36" class="mt-4 h-9 w-24 text-red-400" fill="none" aria-hidden="true"><path d="M2 30C10 31 17 24 25 26C34 29 38 19 47 22C57 25 61 15 70 17C78 19 83 10 88 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              </div>
              <p class="mt-4 text-xs font-medium text-gray-400">Aksiyon bekleyen bulgular</p>
            </div>

            <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><ShieldAlert :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Kritik Açık</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ criticalCount }}</p></div>
                </div>
                <svg viewBox="0 0 90 36" class="mt-4 h-9 w-24 text-red-500" fill="none" aria-hidden="true"><path d="M2 28C13 28 15 22 25 25C34 28 38 18 47 21C57 24 62 15 70 17C78 19 82 8 88 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              </div>
              <p class="mt-4 text-xs font-medium text-gray-400">Öncelikli takip gerekenler</p>
            </div>

            <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Kapatılan</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ closedCount }}</p></div>
                </div>
                <svg viewBox="0 0 90 36" class="mt-4 h-9 w-24 text-emerald-500" fill="none" aria-hidden="true"><path d="M2 30C12 30 15 25 24 27C34 29 39 20 48 22C58 25 61 16 70 17C79 18 83 10 88 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              </div>
              <p class="mt-4 text-xs font-medium text-gray-400">Tamamlanan bulgular</p>
            </div>
          </section>

          <section class="mt-5 overflow-hidden rounded-xl border border-[#e7e9ed] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.045)] dark:border-gray-800 dark:bg-gray-900">
            <div class="border-b border-[#edf0f2] px-4 py-4 dark:border-gray-800 sm:px-5">
              <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div class="relative min-w-0 flex-1 xl:max-w-[335px]">
                  <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#d71920]" />
                  <input v-model="search" type="search" placeholder="Bulgu ara..." class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-red-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" />
                </div>
                <div class="flex flex-wrap gap-2">
                  <select v-model="statusFilter" class="h-11 min-w-[145px] rounded-lg border border-[#dfe3e8] bg-white px-3.5 text-sm font-medium text-[#334155] outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <option value="all">Tüm Durumlar</option>
                    <option value="open">Açık</option>
                    <option value="closed">Kapalı</option>
                  </select>
                  <select v-model="severityFilter" class="h-11 min-w-[160px] rounded-lg border border-[#dfe3e8] bg-white px-3.5 text-sm font-medium text-[#334155] outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <option value="all">Tüm Risk Seviyeleri</option>
                    <option value="dusuk">Düşük</option>
                    <option value="orta">Orta</option>
                    <option value="yuksek">Yüksek</option>
                    <option value="kritik">Kritik</option>
                  </select>
                  <select v-model="categoryFilter" class="h-11 min-w-[150px] rounded-lg border border-[#dfe3e8] bg-white px-3.5 text-sm font-medium text-[#334155] outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <option value="all">Tüm Kategoriler</option>
                    <option v-for="(label, value) in categoryLabels" :key="value" :value="value">{{ label }}</option>
                  </select>
                  <button type="button" class="inline-flex h-11 items-center gap-2 rounded-lg border border-[#dfe3e8] bg-white px-3.5 text-sm font-medium text-[#64748b] hover:border-[#d71920] hover:text-[#d71920] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" @click="resetFilters">
                    <RefreshCw :size="15" />
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto px-3 pb-1 sm:px-4">
              <table class="min-w-[1050px] w-full table-fixed text-left">
                <thead>
                  <tr class="border-b border-[#e8ebee] bg-[#f8f9fa] dark:border-gray-800 dark:bg-gray-800/60">
                    <th class="w-[60px] px-3 py-3 text-[11px] font-bold text-[#64748b]">#</th>
                    <th class="w-[350px] px-3 py-3 text-[11px] font-bold text-[#64748b]">Başlık</th>
                    <th class="w-[135px] px-3 py-3 text-[11px] font-bold text-[#64748b]">Kategori</th>
                    <th class="w-[125px] px-3 py-3 text-[11px] font-bold text-[#64748b]">Risk Seviyesi</th>
                    <th class="w-[120px] px-3 py-3 text-[11px] font-bold text-[#64748b]">Durum</th>
                    <th class="w-[155px] px-3 py-3 text-[11px] font-bold text-[#64748b]">Bildiren</th>
                    <th class="w-[150px] px-3 py-3 text-[11px] font-bold text-[#64748b]">Tespit Tarihi</th>
                    <th class="w-[105px] px-3 py-3 text-[11px] font-bold text-[#64748b]">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="8" class="px-6 py-16 text-center text-sm text-gray-400">Bulgular yükleniyor...</td>
                  </tr>
                  <tr v-else-if="!paginatedFindings.length">
                    <td colspan="8" class="px-6 py-16 text-center">
                      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-300 dark:bg-gray-800"><ClipboardList :size="21" /></div>
                      <p class="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Bulgu bulunamadı</p>
                      <p class="mt-1 text-xs text-gray-400">Arama veya filtre kriterlerini değiştirebilirsiniz.</p>
                    </td>
                  </tr>
                  <tr v-for="finding in paginatedFindings" :key="finding.id" class="group border-b border-[#edf0f2] last:border-0 hover:bg-[#fffafa] dark:border-gray-800 dark:hover:bg-white/[0.02]">
                    <td class="px-3 py-3.5 align-middle text-sm font-medium text-[#64748b]">{{ finding.id }}</td>
                    <td class="px-3 py-3.5 align-middle">
                      <div class="flex min-w-0 items-center gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><ShieldAlert :size="18" /></div>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold text-[#172033] dark:text-white">{{ finding.description || 'Açıklama belirtilmemiş' }}</p>
                          <p v-if="finding.location_note" class="mt-0.5 truncate text-xs text-[#718096]">{{ finding.location_note }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-3.5 align-middle"><span :class="['inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold', categoryClass(finding.category)]">{{ categoryLabels[finding.category] }}</span></td>
                    <td class="px-3 py-3.5 align-middle"><span :class="['inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold', severityClass(finding.severity)]">{{ severityLabels[finding.severity] }}</span></td>
                    <td class="px-3 py-3.5 align-middle"><span :class="['inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold', statusClass(finding.status)]"><span class="h-1.5 w-1.5 rounded-full bg-current" />{{ statusLabels[finding.status] }}</span></td>
                    <td class="px-3 py-3.5 align-middle"><p class="text-sm font-medium text-[#172033] dark:text-gray-200">{{ finding.reported_by_user?.name || '—' }}</p><p class="mt-0.5 text-[11px] text-gray-400">İSG / Saha</p></td>
                    <td class="px-3 py-3.5 align-middle whitespace-nowrap text-xs text-[#64748b]">{{ formatDate(finding.created_at) }}</td>
                    <td class="px-3 py-3.5 align-middle"><button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e1e5e9] bg-white px-3 text-xs font-semibold text-[#334155] transition hover:border-[#d71920] hover:text-[#d71920] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"><Eye :size="14" /> Detay</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex flex-col gap-3 border-t border-[#edf0f2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
              <p class="text-xs font-medium text-[#64748b]">{{ filteredFindings.length ? ((page - 1) * pageSize) + 1 : 0 }}–{{ Math.min(page * pageSize, filteredFindings.length) }} kayıt gösteriliyor <span class="font-normal text-gray-400">(Toplam: {{ filteredFindings.length }})</span></p>
              <div class="flex items-center gap-1.5">
                <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e5e9] text-[#94a3b8] hover:border-[#d71920] hover:text-[#d71920] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700" :disabled="page === 1" @click="setPage(page - 1)"><ChevronLeft :size="16" /></button>
                <button v-for="item in pageCount" :key="item" type="button" :class="['flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition', item === page ? 'border-[#d71920] bg-[#d71920] text-white shadow-sm' : 'border-[#e1e5e9] bg-white text-[#475569] hover:border-[#d71920] hover:text-[#d71920] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300']" @click="setPage(item)">{{ item }}</button>
                <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e5e9] text-[#64748b] hover:border-[#d71920] hover:text-[#d71920] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700" :disabled="page === pageCount" @click="setPage(page + 1)"><ChevronRight :size="16" /></button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">Yönlendiriliyor...</div>
</template>
