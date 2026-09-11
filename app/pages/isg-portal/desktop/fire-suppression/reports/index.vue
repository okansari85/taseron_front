<script setup lang="ts">
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  LoaderCircle,
  Trash2,
  Upload,
  XCircle,
} from '@lucide/vue'
import { fireSuppressionReportApi } from '~/api/fire-suppression-report'
import { FIRE_SUPPRESSION_CATEGORY_LABELS } from '~/types/fire-suppression-inventory'
import type { FireSuppressionReport } from '~/types/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const reports = ref<FireSuppressionReport[]>([])
const loading = ref(false)

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const { data } = await fireSuppressionReportApi.list(context.branchId)
    reports.value = data
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

const currentReports = computed(() => reports.value.filter(r => r.is_current))
const archivedReports = computed(() => reports.value.filter(r => !r.is_current))

const uygunCount = computed(() => currentReports.value.filter(r => r.overall_result === 'uygun').length)
const uygunDegilCount = computed(() => currentReports.value.filter(r => r.overall_result === 'uygun_degil').length)
const yaklasanCount = computed(() => {
  const now = Date.now()
  const in30Days = now + 30 * 24 * 60 * 60 * 1000
  return currentReports.value.filter((r) => {
    if (!r.next_control_date) return false
    const t = new Date(r.next_control_date).getTime()
    return t >= now && t <= in30Days
  }).length
})

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

const resultMeta = (status?: string | null) => status === 'uygun'
  ? { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  : status === 'uygun_degil'
    ? { label: 'Uygun Değil', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' }
    : { label: 'Belirtilmedi', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }

const deletingId = ref<number | null>(null)
const removeReport = async (report: FireSuppressionReport) => {
  if (!window.confirm(`${formatDate(report.report_date)} tarihli raporu silmek istediğinize emin misiniz? (Envanter kayıtları etkilenmez)`)) return
  deletingId.value = report.id
  try {
    await fireSuppressionReportApi.remove(report.id)
    $toast.success('Rapor silindi.')
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Rapor silinemedi.')
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
              <h1 class="text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#111827] dark:text-white">Raporlar</h1>
              <p class="mt-1.5 text-[15px] text-[#64748b] dark:text-gray-400">Periyodik kontrol raporları — bir PDF, bir rapordur.</p>
            </div>
            <NuxtLink to="/isg-portal/desktop/fire-suppression/reports/upload" class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d71920] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(215,25,32,0.18)] transition hover:bg-[#b9151b]">
              <Upload :size="18" stroke-width="2.5" />
              Rapor Yükle
            </NuxtLink>
          </section>

          <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>

          <template v-else>
            <section class="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Toplam Güncel Rapor</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ currentReports.length }}</p></div>
                </div>
              </div>
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Uygun</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ uygunCount }}</p></div>
                </div>
              </div>
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><XCircle :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Uygun Değil</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ uygunDegilCount }}</p></div>
                </div>
              </div>
              <div class="relative overflow-hidden rounded-xl border border-[#e7e9ed] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10"><Clock :size="22" /></span>
                  <div><p class="text-sm font-medium text-[#64748b]">Yaklaşan Kontrol</p><p class="mt-1 text-[29px] font-bold leading-none text-[#172033] dark:text-white">{{ yaklasanCount }}</p></div>
                </div>
              </div>
            </section>

            <section class="mb-3">
              <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Güncel</p>
              <div v-if="!currentReports.length" class="rounded-xl border border-dashed border-[#dfe3e8] bg-white py-10 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">Henüz rapor yüklenmemiş.</div>
              <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <NuxtLink
                  v-for="report in currentReports"
                  :key="report.id"
                  :to="`/isg-portal/desktop/fire-suppression/reports/${report.id}`"
                  class="rounded-xl border border-[#e7e9ed] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-3">
                      <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="20" /></span>
                      <div>
                        <p class="text-sm font-bold text-[#172033] dark:text-white">{{ formatDate(report.report_date) }}</p>
                        <p class="text-xs text-gray-400">{{ report.findings_count ?? 0 }} uygunsuzluk</p>
                      </div>
                    </div>
                    <ChevronRight :size="16" class="mt-1 text-gray-300" />
                  </div>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="resultMeta(report.overall_result).cls">{{ resultMeta(report.overall_result).label }}</span>
                    <span v-for="c in report.covered_categories" :key="c" class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</span>
                  </div>
                  <p v-if="report.next_control_date" class="mt-3 flex items-center gap-1.5 text-xs text-gray-400"><Calendar :size="13" />Sonraki kontrol: {{ formatDate(report.next_control_date) }}</p>
                </NuxtLink>
              </div>
            </section>

            <section v-if="archivedReports.length" class="mt-6">
              <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Geçmiş / Arşiv</p>
              <div class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                <NuxtLink
                  v-for="report in archivedReports"
                  :key="report.id"
                  :to="`/isg-portal/desktop/fire-suppression/reports/${report.id}`"
                  class="flex items-center justify-between gap-3 border-b border-[#f1f2f4] px-4 py-3.5 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5"><FileText :size="16" /></span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-[#172033] dark:text-white">{{ formatDate(report.report_date) }}</p>
                      <p class="truncate text-xs text-gray-400">{{ report.file_name }}</p>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-3">
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="resultMeta(report.overall_result).cls">{{ resultMeta(report.overall_result).label }}</span>
                    <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#d71920] dark:hover:bg-red-500/10" :disabled="deletingId === report.id" @click.prevent="removeReport(report)">
                      <LoaderCircle v-if="deletingId === report.id" :size="13" class="animate-spin" />
                      <Trash2 v-else :size="13" />
                    </button>
                  </div>
                </NuxtLink>
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
