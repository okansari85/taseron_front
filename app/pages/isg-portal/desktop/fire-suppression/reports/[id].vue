<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Container,
  Cylinder,
  Download,
  Droplets,
  ExternalLink,
  FileText,
  FireExtinguisher,
  Gauge,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Waves,
  XCircle,
} from '@lucide/vue'
import { fireSuppressionReportApi } from '~/api/fire-suppression-report'
import {
  FIRE_SUPPRESSION_CATEGORIES,
  FIRE_SUPPRESSION_CATEGORY_LABELS,
  type FireSuppressionCategory,
} from '~/types/fire-suppression-inventory'
import { FIRE_SUPPRESSION_CONTROL_ITEM_STATUS_LABELS, FIRE_SUPPRESSION_REPORT_FILE_TYPE_LABELS, type FireSuppressionReport } from '~/types/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const route = useRoute()
const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const report = ref<FireSuppressionReport | null>(null)
const loading = ref(true)
const tab = ref<'overview' | 'systems' | 'control_items' | 'findings' | 'file'>('overview')
const deleting = ref(false)

const load = async () => {
  loading.value = true
  try {
    const res = await fireSuppressionReportApi.get(Number(route.params.id))
    report.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!context.ready) {
    await navigateTo('/isg-portal/desktop/select-location')
    return
  }
  await load()
})

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

const formatWeekday = (value?: string | null) => {
  if (!value) return null
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(new Date(value))
}

const daysRemaining = (value?: string | null): number | null => {
  if (!value) return null
  const target = new Date(value)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const CATEGORY_ICONS: Record<FireSuppressionCategory, typeof Droplets> = {
  sprinkler: Droplets,
  yangin_dolabi: FireExtinguisher,
  hidrant: Waves,
  yangin_pompasi: Gauge,
  su_deposu: Cylinder,
  sabit_boru: Waves,
  gazli_sondurme: Container,
  diger: FileText,
}

const CATEGORY_UNIT_NOUN: Record<FireSuppressionCategory, string> = {
  sprinkler: 'başlık',
  yangin_dolabi: 'dolap',
  hidrant: 'hidrant',
  yangin_pompasi: 'pompa',
  su_deposu: 'depo',
  sabit_boru: 'hat',
  gazli_sondurme: 'sistem',
  diger: 'ekipman',
}

const categorySubtitle = (category: FireSuppressionCategory): string | null => {
  const count = (report.value?.inventory_items ?? []).filter(i => i.category === category).length
  return count > 0 ? `${count} adet ${CATEGORY_UNIT_NOUN[category]}` : null
}

const resultMeta = (status?: string | null) => status === 'uygun'
  ? { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  : status === 'uygun_degil'
    ? { label: 'Uygun Değil', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' }
    : { label: 'Belirtilmedi', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }

const controlItemStatusMeta = (status: string) => status === 'uygun'
  ? { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  : status === 'uygun_degil'
    ? { label: 'Uygun Değil', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' }
    : { label: 'Uygulanamıyor', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }

const scopeLabel = (scope: string) => ({ all: 'Tüm Ekipmanlar', specific: 'Belirli Ekipman', area: 'Alan', unknown: 'Belirsiz' }[scope] ?? scope)

// --- Genel Bakış: sistem (kategori) bazlı özet — TÜM kategoriler listelenir,
// raporda hiç geçmeyenler "Raporda Yok" olarak işaretlenir.
const coveredCategorySummaries = computed(() => {
  const covered = new Set(report.value?.covered_categories ?? [])
  return FIRE_SUPPRESSION_CATEGORIES.map((category) => {
    const items = (report.value?.control_items ?? []).filter(ci => ci.category === category)
    const nonconformCount = items.filter(ci => ci.status === 'uygun_degil').length
    const isCovered = covered.has(category) || items.length > 0
    return {
      category,
      controlItemCount: items.length,
      nonconformCount,
      status: !isCovered ? null : (items.length ? (nonconformCount > 0 ? 'uygun_degil' : 'uygun') : 'uygun'),
    }
  })
})

const controlItemsSummary = computed(() => {
  const items = report.value?.control_items ?? []
  return {
    total: items.length,
    uygun: items.filter(i => i.status === 'uygun').length,
    uygunDegil: items.filter(i => i.status === 'uygun_degil').length,
    uygulanamiyor: items.filter(i => i.status === 'uygulanamiyor').length,
  }
})

const openFindingsCount = computed(() => (report.value?.findings ?? []).filter(f => f.status === 'open').length)

// --- Sistemler sekmesi ---
const selectedSystemCategory = ref<FireSuppressionCategory | null>(null)
watch(report, (r) => {
  if (r?.covered_categories?.length) selectedSystemCategory.value = r.covered_categories[0]
}, { immediate: true })

const controlItemsForCategory = (category: FireSuppressionCategory | null) =>
  (report.value?.control_items ?? []).filter(ci => ci.category === category)

// --- Kontrol Maddeleri sekmesi (tüm sistemler, filtrelenebilir) ---
const controlItemCategoryFilter = ref<FireSuppressionCategory | ''>('')
const controlItemStatusFilter = ref<'' | 'uygun' | 'uygun_degil' | 'uygulanamiyor'>('')
const filteredControlItems = computed(() => (report.value?.control_items ?? []).filter((ci) => {
  if (controlItemCategoryFilter.value && ci.category !== controlItemCategoryFilter.value) return false
  if (controlItemStatusFilter.value && ci.status !== controlItemStatusFilter.value) return false
  return true
}))

const exportControlItemsCsv = () => {
  if (!report.value) return
  const rows = [
    ['Sistem', 'Ekipman', 'Kod', 'Kontrol Maddesi', 'Durum', 'Açıklama'],
    ...filteredControlItems.value.map(ci => [
      ci.category ? FIRE_SUPPRESSION_CATEGORY_LABELS[ci.category] : '',
      ci.equipment_code ?? '',
      ci.code ?? '',
      ci.title,
      FIRE_SUPPRESSION_CONTROL_ITEM_STATUS_LABELS[ci.status],
      ci.description ?? '',
    ]),
  ]
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kontrol-maddeleri-${report.value.id}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const removeReport = async () => {
  if (!report.value) return
  if (!window.confirm(`${formatDate(report.value.report_date)} tarihli raporu silmek istediğinize emin misiniz? (Envanter kayıtları etkilenmez)`)) return
  deleting.value = true
  try {
    await fireSuppressionReportApi.remove(report.value.id)
    $toast.success('Rapor silindi.')
    await navigateTo('/isg-portal/desktop/fire-suppression/reports')
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Rapor silinemedi.')
  } finally {
    deleting.value = false
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
          <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#64748b] hover:text-[#111827] dark:hover:text-white">
            <ArrowLeft :size="16" />
            Raporlara Dön
          </NuxtLink>

          <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>

          <template v-else-if="report">
            <section class="mb-5 flex flex-col gap-4 rounded-xl border border-[#e7e9ed] bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-lg font-bold text-[#172033] dark:text-white">Yangın Söndürme Sistemleri Periyodik Kontrol Raporu</p>
                    <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 :size="12" />İşlendi</span>
                  </div>
                  <p class="mt-0.5 text-xs text-gray-400">
                    <span v-if="report.report_no">Rapor No: {{ report.report_no }} · </span>
                    <span v-if="report.inspection_company_name">Akredite Firma: {{ report.inspection_company_name }} · </span>
                    {{ report.file_name }}
                    <span v-if="report.uploaded_by_user"> · {{ report.uploaded_by_user.name }}</span>
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <a :href="report.file_url" target="_blank" rel="noopener" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"><Download :size="13" />Raporu İndir</a>
                  <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-gray-500 hover:border-[#d71920]/40 hover:text-[#d71920] disabled:opacity-60 dark:border-gray-700" :disabled="deleting" @click="removeReport"><Trash2 :size="13" />Raporu Sil</button>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-4">
                <div class="flex items-start gap-3 rounded-lg border border-[#f1f2f4] p-3 dark:border-gray-800">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10"><Calendar :size="16" /></span>
                  <div>
                    <p class="text-[11px] text-gray-400">Rapor Tarihi</p>
                    <p class="mt-0.5 text-sm font-bold text-[#172033] dark:text-white">{{ formatDate(report.report_date) }}</p>
                    <p v-if="formatWeekday(report.report_date)" class="text-[10px] text-gray-400">{{ formatWeekday(report.report_date) }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 rounded-lg border border-[#f1f2f4] p-3 dark:border-gray-800">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10"><CalendarClock :size="16" /></span>
                  <div>
                    <p class="text-[11px] text-gray-400">Gelecek Muayene Tarihi</p>
                    <p class="mt-0.5 text-sm font-bold text-[#172033] dark:text-white">{{ formatDate(report.next_control_date) }}</p>
                    <span v-if="daysRemaining(report.next_control_date) !== null" class="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold" :class="(daysRemaining(report.next_control_date) ?? 0) < 0 ? 'bg-red-50 text-[#d71920] dark:bg-red-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'">
                      {{ (daysRemaining(report.next_control_date) ?? 0) < 0 ? `${Math.abs(daysRemaining(report.next_control_date) ?? 0)} gün gecikti` : `${daysRemaining(report.next_control_date)} gün kaldı` }}
                    </span>
                  </div>
                </div>
                <div class="flex items-start gap-3 rounded-lg border border-[#f1f2f4] p-3 dark:border-gray-800">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5"><CalendarCheck2 :size="16" /></span>
                  <div>
                    <p class="text-[11px] text-gray-400">Kontrol Edilen Ekipman</p>
                    <p class="mt-0.5 text-sm font-bold text-[#172033] dark:text-white">{{ report.inventory_items?.length ?? 0 }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 rounded-lg p-3" :class="report.overall_result === 'uygun' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-black/10" :class="report.overall_result === 'uygun' ? 'text-emerald-600' : 'text-[#d71920]'">
                    <CheckCircle2 v-if="report.overall_result === 'uygun'" :size="18" />
                    <XCircle v-else :size="18" />
                  </span>
                  <div>
                    <p class="text-[11px]" :class="report.overall_result === 'uygun' ? 'text-emerald-600' : 'text-[#d71920]'">Genel Durum</p>
                    <p class="text-sm font-bold" :class="report.overall_result === 'uygun' ? 'text-emerald-600' : 'text-[#d71920]'">{{ resultMeta(report.overall_result).label }}</p>
                    <p class="text-[10px]" :class="report.overall_result === 'uygun' ? 'text-emerald-600/80' : 'text-[#d71920]/80'">{{ report.overall_result === 'uygun' ? 'Raporda uygunsuzluk tespit edilmedi.' : 'Raporda uygunsuzluklar tespit edildi.' }}</p>
                  </div>
                </div>
              </div>
            </section>

            <div class="mb-5 inline-flex flex-wrap rounded-lg border border-[#e7e9ed] bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'overview' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'overview'">Genel Bakış</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'systems' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'systems'">Sistemler</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'control_items' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'control_items'">Kontrol Maddeleri ({{ report.control_items?.length ?? 0 }})</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'findings' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'findings'">Uygunsuzluklar ({{ report.findings?.length ?? 0 }})</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'file' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'file'">Dosya ({{ 1 + (report.files?.length ?? 0) }})</button>
            </div>

            <!-- Genel Bakış -->
            <section v-if="tab === 'overview'" class="grid gap-4 lg:grid-cols-3">
              <div class="space-y-4 lg:col-span-2">
                <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p class="text-xs font-bold uppercase tracking-wide text-gray-400">Sistem Bazlı Durum</p>
                  <p class="mb-3 text-[11px] text-gray-400">Raporda tespit edilen yangın söndürme sistemleri ve uygunluk durumları</p>
                  <div class="divide-y divide-[#f1f2f4] dark:divide-gray-800">
                    <button v-for="s in coveredCategorySummaries" :key="s.category" type="button" class="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5" @click="tab = 'systems'; selectedSystemCategory = s.category">
                      <div class="flex min-w-0 items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10">
                          <component :is="CATEGORY_ICONS[s.category]" :size="18" />
                        </span>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[s.category] }}</p>
                          <p v-if="categorySubtitle(s.category)" class="text-[11px] text-gray-400">{{ categorySubtitle(s.category) }}</p>
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-4">
                        <span v-if="s.status" class="w-[92px] rounded-full px-2.5 py-1 text-center text-[11px] font-semibold" :class="s.status === 'uygun' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-[#d71920] dark:bg-red-500/10'">{{ s.status === 'uygun' ? 'Uygun' : 'Uygun Değil' }}</span>
                        <span v-else class="w-[92px] rounded-full bg-gray-100 px-2.5 py-1 text-center text-[11px] font-medium text-gray-400 dark:bg-white/5">Raporda Yok</span>
                        <div class="hidden text-right sm:block">
                          <p class="text-xs font-semibold text-[#172033] dark:text-white">{{ s.controlItemCount || '—' }}</p>
                          <p class="text-[10px] text-gray-400">kontrol maddesi</p>
                        </div>
                        <div class="hidden text-right sm:block">
                          <p class="text-xs font-semibold" :class="s.nonconformCount > 0 ? 'text-[#d71920]' : 'text-gray-400'">{{ s.status ? s.nonconformCount : '—' }}</p>
                          <p class="text-[10px] text-gray-400">uygunsuzluk</p>
                        </div>
                        <ChevronRight :size="16" class="text-gray-300" />
                      </div>
                    </button>
                  </div>
                </div>

                <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Kontrol Maddeleri Özeti</p>
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div class="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/5">
                      <p class="text-2xl font-bold text-[#172033] dark:text-white">{{ controlItemsSummary.total }}</p>
                      <p class="text-[11px] text-gray-400">Toplam Madde</p>
                    </div>
                    <div class="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                      <p class="text-2xl font-bold text-emerald-600">{{ controlItemsSummary.uygun }}</p>
                      <p class="text-[11px] text-emerald-600">Uygun</p>
                    </div>
                    <div class="rounded-lg bg-red-50 p-3 text-center dark:bg-red-500/10">
                      <p class="text-2xl font-bold text-[#d71920]">{{ controlItemsSummary.uygunDegil }}</p>
                      <p class="text-[11px] text-[#d71920]">Uygun Değil</p>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/5">
                      <p class="text-2xl font-bold text-gray-500 dark:text-gray-300">{{ controlItemsSummary.uygulanamiyor }}</p>
                      <p class="text-[11px] text-gray-400">Uygulaması Yok</p>
                    </div>
                  </div>
                </div>

                <div v-if="openFindingsCount > 0" class="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                  <div class="flex items-center gap-3">
                    <AlertTriangle :size="20" class="shrink-0 text-[#d71920]" />
                    <div>
                      <p class="text-sm font-bold text-[#d71920]">Açık Uygunsuzluklar</p>
                      <p class="text-xs text-red-600/80 dark:text-red-400/80">Raporda tespit edilen ve kapatılmamış uygunsuzluklar</p>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-4">
                    <p class="text-3xl font-bold leading-none text-[#d71920]">{{ openFindingsCount }}</p>
                    <button type="button" class="inline-flex items-center gap-1 rounded-lg bg-[#d71920] px-3 py-2 text-xs font-semibold text-white" @click="tab = 'findings'">Uygunsuzlukları Gör<ChevronRight :size="13" /></button>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Rapor Önizleme</p>
                <iframe :src="report.file_url" class="h-[500px] w-full rounded-lg border border-[#f1f2f4] dark:border-gray-800" />
                <p v-if="report.notes" class="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ report.notes }}</p>
              </div>
            </section>

            <!-- Sistemler -->
            <section v-else-if="tab === 'systems'">
              <div class="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
                <button
                  v-for="category in (report.covered_categories?.length ? report.covered_categories : FIRE_SUPPRESSION_CATEGORIES)"
                  :key="category"
                  type="button"
                  class="rounded-xl border p-4 text-left transition"
                  :class="selectedSystemCategory === category ? 'border-[#d71920] bg-red-50/40 dark:bg-red-500/5' : 'border-[#e7e9ed] bg-white hover:border-[#d71920]/30 dark:border-gray-800 dark:bg-gray-900'"
                  @click="selectedSystemCategory = category"
                >
                  <span class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10">
                    <component :is="CATEGORY_ICONS[category]" :size="16" />
                  </span>
                  <p class="text-sm font-bold text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[category] }}</p>
                  <p class="mt-2 text-xs text-gray-400">{{ controlItemsForCategory(category).length }} kontrol maddesi</p>
                  <p class="mt-0.5 text-xs font-semibold" :class="controlItemsForCategory(category).some(c => c.status === 'uygun_degil') ? 'text-[#d71920]' : 'text-emerald-600'">
                    {{ controlItemsForCategory(category).length ? (controlItemsForCategory(category).some(c => c.status === 'uygun_degil') ? 'Uygun Değil' : 'Uygun') : 'Raporda Yok' }}
                  </p>
                </button>
              </div>

              <div v-if="selectedSystemCategory" class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                <p class="border-b border-[#f1f2f4] px-4 py-3 text-sm font-bold text-[#172033] dark:border-gray-800 dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[selectedSystemCategory] }} — Kontrol Maddeleri</p>
                <div v-if="!controlItemsForCategory(selectedSystemCategory).length" class="py-10 text-center text-xs text-gray-400">Bu sistem için kontrol maddesi kaydı yok.</div>
                <table v-else class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-[#f1f2f4] text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                      <th class="px-4 py-2.5">Ekipman</th>
                      <th class="px-4 py-2.5">Kod</th>
                      <th class="px-4 py-2.5">Kontrol Maddesi</th>
                      <th class="px-4 py-2.5">Durum</th>
                      <th class="px-4 py-2.5">Açıklama / Tespit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ci in controlItemsForCategory(selectedSystemCategory)" :key="ci.id" class="border-b border-[#f1f2f4] last:border-0 dark:border-gray-800">
                      <td class="px-4 py-2.5 text-xs font-semibold text-gray-500">{{ ci.equipment_code || '—' }}</td>
                      <td class="px-4 py-2.5 text-xs font-semibold text-gray-500">{{ ci.code || '—' }}</td>
                      <td class="px-4 py-2.5 text-gray-700 dark:text-gray-200">{{ ci.title }}</td>
                      <td class="px-4 py-2.5"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="controlItemStatusMeta(ci.status).cls">{{ controlItemStatusMeta(ci.status).label }}</span></td>
                      <td class="px-4 py-2.5 text-xs text-gray-500">{{ ci.description || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Kontrol Maddeleri -->
            <section v-else-if="tab === 'control_items'">
              <div class="mb-4 flex flex-wrap items-center gap-2">
                <select v-model="controlItemCategoryFilter" class="h-9 rounded-lg border border-[#dfe3e8] bg-white px-2.5 text-xs outline-none dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Sistem: Tümü</option>
                  <option v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" :value="c">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</option>
                </select>
                <select v-model="controlItemStatusFilter" class="h-9 rounded-lg border border-[#dfe3e8] bg-white px-2.5 text-xs outline-none dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Durum: Tümü</option>
                  <option value="uygun">Uygun</option>
                  <option value="uygun_degil">Uygun Değil</option>
                  <option value="uygulanamiyor">Uygulanamıyor</option>
                </select>
                <button type="button" class="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="exportControlItemsCsv"><Download :size="13" />CSV'ye Aktar</button>
              </div>
              <div class="overflow-x-auto rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                <div v-if="!filteredControlItems.length" class="py-10 text-center text-xs text-gray-400">Kayıt yok.</div>
                <table v-else class="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr class="border-b border-[#f1f2f4] text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                      <th class="px-4 py-2.5">Sistem</th>
                      <th class="px-4 py-2.5">Ekipman</th>
                      <th class="px-4 py-2.5">Kod</th>
                      <th class="px-4 py-2.5">Kontrol Maddesi</th>
                      <th class="px-4 py-2.5">Durum</th>
                      <th class="px-4 py-2.5">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ci in filteredControlItems" :key="ci.id" class="border-b border-[#f1f2f4] last:border-0 dark:border-gray-800">
                      <td class="px-4 py-2.5 text-xs text-gray-500">{{ ci.category ? FIRE_SUPPRESSION_CATEGORY_LABELS[ci.category] : '—' }}</td>
                      <td class="px-4 py-2.5 text-xs text-gray-500">{{ ci.equipment_code || '—' }}</td>
                      <td class="px-4 py-2.5 text-xs font-semibold text-gray-500">{{ ci.code || '—' }}</td>
                      <td class="px-4 py-2.5 text-gray-700 dark:text-gray-200">{{ ci.title }}</td>
                      <td class="px-4 py-2.5"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="controlItemStatusMeta(ci.status).cls">{{ controlItemStatusMeta(ci.status).label }}</span></td>
                      <td class="px-4 py-2.5 text-xs text-gray-500">{{ ci.description || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Uygunsuzluklar -->
            <section v-else-if="tab === 'findings'" class="space-y-3">
              <div v-if="!report.findings?.length" class="rounded-xl border border-dashed border-[#dfe3e8] bg-white py-12 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">Bu raporda uygunsuzluk kaydı yok.</div>
              <div v-for="finding in report.findings" :key="finding.id" class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-start gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><AlertTriangle :size="16" /></span>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span v-if="finding.category" class="text-xs font-semibold text-gray-500">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[finding.category] }}</span>
                      <span v-if="finding.control_item" class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ finding.control_item }}</span>
                      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ scopeLabel(finding.scope) }}</span>
                      <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="finding.status === 'open' ? 'bg-red-50 text-[#d71920] dark:bg-red-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'">{{ finding.status === 'open' ? 'Açık' : 'Kapalı' }}</span>
                    </div>
                    <p class="mt-1.5 text-sm text-gray-700 dark:text-gray-200">{{ finding.description }}</p>
                    <p v-if="finding.area_note" class="mt-1 text-xs text-gray-400">Alan: {{ finding.area_note }}</p>
                    <div v-if="finding.affected_items?.length" class="mt-2 flex flex-wrap gap-1.5">
                      <span v-for="item in finding.affected_items" :key="item.id" class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-[#d71920] dark:bg-red-500/10">{{ item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Dosya -->
            <section v-else class="space-y-3">
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
                <FileText :size="32" class="mx-auto mb-3 text-gray-300" />
                <p class="mb-1 text-sm font-semibold text-[#172033] dark:text-white">{{ report.file_name }}</p>
                <p class="text-xs text-gray-400">Rapor Dokümanı</p>
                <a :href="report.file_url" target="_blank" rel="noopener" class="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#d71920] px-4 py-2.5 text-sm font-semibold text-white">
                  <ExternalLink :size="15" />
                  PDF'i Görüntüle
                </a>
              </div>

              <div v-if="report.files?.length" class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                <div v-for="f in report.files" :key="f.id" class="flex items-center gap-3 border-b border-[#f1f2f4] px-4 py-3 last:border-0 dark:border-gray-800">
                  <ImageIcon v-if="f.file_type === 'fotograf'" :size="16" class="shrink-0 text-gray-400" />
                  <Paperclip v-else :size="16" class="shrink-0 text-gray-400" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-[#172033] dark:text-white">{{ f.file_name }}</p>
                    <p class="text-xs text-gray-400">{{ FIRE_SUPPRESSION_REPORT_FILE_TYPE_LABELS[f.file_type] }}<span v-if="f.description"> · {{ f.description }}</span></p>
                  </div>
                  <a :href="f.file_url" target="_blank" rel="noopener" class="shrink-0 rounded-lg border border-[#dfe3e8] px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Görüntüle</a>
                </div>
              </div>
            </section>
          </template>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
