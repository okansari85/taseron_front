<script setup lang="ts">
import { AlertTriangle, ArrowLeft, ExternalLink, FileText } from '@lucide/vue'
import { fireSuppressionReportApi } from '~/api/fire-suppression-report'
import { FIRE_SUPPRESSION_CATEGORY_LABELS } from '~/types/fire-suppression-inventory'
import type { FireSuppressionReport } from '~/types/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const route = useRoute()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const report = ref<FireSuppressionReport | null>(null)
const loading = ref(true)
const tab = ref<'overview' | 'findings' | 'file'>('overview')

onMounted(async () => {
  if (!context.ready) {
    await navigateTo('/isg-portal/desktop/select-location')
    return
  }
  loading.value = true
  try {
    const res = await fireSuppressionReportApi.get(Number(route.params.id))
    report.value = res.data
  } finally {
    loading.value = false
  }
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

const scopeLabel = (scope: string) => ({ all: 'Tüm Ekipmanlar', specific: 'Belirli Ekipman', area: 'Alan', unknown: 'Belirsiz' }[scope] ?? scope)
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1100px]">
          <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#64748b] hover:text-[#111827] dark:hover:text-white">
            <ArrowLeft :size="16" />
            Raporlara Dön
          </NuxtLink>

          <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>

          <template v-else-if="report">
            <section class="mb-6 flex flex-col gap-4 rounded-xl border border-[#e7e9ed] bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="22" /></span>
                <div>
                  <p class="text-lg font-bold text-[#172033] dark:text-white">{{ formatDate(report.report_date) }} Periyodik Kontrol Raporu</p>
                  <p class="text-xs text-gray-400">{{ report.file_name }} {{ report.uploaded_by_user ? `· ${report.uploaded_by_user.name}` : '' }}</p>
                </div>
              </div>
              <span class="rounded-full px-3 py-1.5 text-xs font-semibold" :class="resultMeta(report.overall_result).cls">{{ resultMeta(report.overall_result).label }}</span>
            </section>

            <div class="mb-5 inline-flex rounded-lg border border-[#e7e9ed] bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'overview' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'overview'">Genel Bakış</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'findings' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'findings'">Uygunsuzluklar ({{ report.findings?.length ?? 0 }})</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'file' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'file'">Dosya</button>
            </div>

            <section v-if="tab === 'overview'" class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Rapor Bilgileri</p>
                <dl class="space-y-2.5 text-sm">
                  <div class="flex justify-between"><dt class="text-gray-500">Rapor Tarihi</dt><dd class="font-medium">{{ formatDate(report.report_date) }}</dd></div>
                  <div class="flex justify-between"><dt class="text-gray-500">Sonraki Kontrol</dt><dd class="font-medium">{{ formatDate(report.next_control_date) }}</dd></div>
                  <div class="flex justify-between"><dt class="text-gray-500">Kontrol Edilen Ekipman</dt><dd class="font-medium">{{ report.inventory_items?.length ?? 0 }}</dd></div>
                </dl>
                <p v-if="report.notes" class="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ report.notes }}</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Kontrol Edilen Sistemler</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="c in report.covered_categories" :key="c" class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</span>
                  <p v-if="!report.covered_categories?.length" class="text-xs text-gray-400">Belirtilmemiş.</p>
                </div>
                <p class="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Kontrol Edilen Ekipmanlar</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="item in report.inventory_items" :key="item.id" class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}</span>
                  <p v-if="!report.inventory_items?.length" class="text-xs text-gray-400">Belirtilmemiş.</p>
                </div>
              </div>
            </section>

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

            <section v-else class="rounded-xl border border-[#e7e9ed] bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
              <FileText :size="32" class="mx-auto mb-3 text-gray-300" />
              <p class="mb-1 text-sm font-semibold text-[#172033] dark:text-white">{{ report.file_name }}</p>
              <a :href="report.file_url" target="_blank" rel="noopener" class="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#d71920] px-4 py-2.5 text-sm font-semibold text-white">
                <ExternalLink :size="15" />
                PDF'i Görüntüle
              </a>
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
