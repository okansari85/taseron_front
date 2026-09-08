<script setup lang="ts">
import { AlertTriangle, CheckCircle2, ClipboardList, Filter, Plus, Search, ShieldAlert } from '@lucide/vue'
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
    return matchesSearch && matchesStatus && matchesSeverity
  })
})

const openCount = computed(() => findings.value.filter(item => item.status === 'open').length)
const criticalCount = computed(() => findings.value.filter(item => item.severity === 'kritik' && item.status === 'open').length)
const closedCount = computed(() => findings.value.filter(item => item.status === 'closed').length)

const severityClass = (severity: FieldFindingSeverity) => ({
  dusuk: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  orta: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
  yuksek: 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400',
  kritik: 'bg-error-100 text-error-800 dark:bg-error-500/15 dark:text-error-300',
}[severity])

const statusClass = (status: FieldFindingStatus) => status === 'open'
  ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  : 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'

const formatDate = (value: string) => new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

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
  <div v-if="context.ready" class="min-h-screen bg-gray-50 font-outfit dark:bg-gray-950">
    <IsgSidebar :desktop="true" />
    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[290px]' : 'lg:pl-[90px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 py-7 sm:px-8 lg:px-10">
        <div class="mx-auto max-w-[1500px]">
          <div class="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
                <ClipboardList :size="14" />
                Saha Yönetimi
              </div>
              <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Saha Bulguları</h1>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Sahada tespit edilen uygunsuzlukları, risk seviyelerini ve kapanış durumlarını takip edin.
              </p>
            </div>
            <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
              <Plus :size="17" /> Yeni Bulgu
            </button>
          </div>

          <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-gray-400">Toplam Bulgu</span>
                <ClipboardList :size="18" class="text-brand-500" />
              </div>
              <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{{ findings.length }}</p>
              <p class="mt-1 text-xs text-gray-400">Bu çalışma alanı</p>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-gray-400">Açık Bulgular</span>
                <AlertTriangle :size="18" class="text-warning-500" />
              </div>
              <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{{ openCount }}</p>
              <p class="mt-1 text-xs text-gray-400">Aksiyon bekleyen</p>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-gray-400">Kritik Açık</span>
                <ShieldAlert :size="18" class="text-error-500" />
              </div>
              <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{{ criticalCount }}</p>
              <p class="mt-1 text-xs text-gray-400">Öncelikli takip</p>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-gray-400">Kapatılan</span>
                <CheckCircle2 :size="18" class="text-success-500" />
              </div>
              <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{{ closedCount }}</p>
              <p class="mt-1 text-xs text-gray-400">Tamamlanan bulgular</p>
            </div>
          </section>

          <section class="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div class="border-b border-gray-100 p-5 dark:border-gray-800">
              <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div class="relative min-w-0 flex-1 xl:max-w-md">
                  <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input v-model="search" type="search" placeholder="Bulgu, konum veya bildiren kişi ara..." class="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" />
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <div class="flex items-center gap-1.5 text-xs text-gray-400"><Filter :size="14" /> Filtrele</div>
                  <select v-model="statusFilter" class="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <option value="all">Tüm durumlar</option>
                    <option value="open">Açık</option>
                    <option value="closed">Kapalı</option>
                  </select>
                  <select v-model="severityFilter" class="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <option value="all">Tüm seviyeler</option>
                    <option value="dusuk">Düşük</option>
                    <option value="orta">Orta</option>
                    <option value="yuksek">Yüksek</option>
                    <option value="kritik">Kritik</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-[900px] w-full text-left">
                <thead class="bg-gray-50/80 dark:bg-gray-800/40">
                  <tr class="border-b border-gray-100 dark:border-gray-800">
                    <th class="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Bulgu</th>
                    <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Kategori</th>
                    <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Risk</th>
                    <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Durum</th>
                    <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Bildiren</th>
                    <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Tarih</th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="loading">
                    <td colspan="7" class="px-6 py-16 text-center text-sm text-gray-400">Bulgular yükleniyor...</td>
                  </tr>
                  <tr v-else-if="!filteredFindings.length">
                    <td colspan="7" class="px-6 py-16 text-center">
                      <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-300 dark:bg-gray-800"><ClipboardList :size="20" /></div>
                      <p class="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">Bulgu bulunamadı</p>
                      <p class="mt-1 text-xs text-gray-400">Arama veya filtre kriterlerini değiştirebilirsiniz.</p>
                    </td>
                  </tr>
                  <tr v-for="finding in filteredFindings" :key="finding.id" class="group transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                    <td class="max-w-[330px] px-6 py-4">
                      <p class="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ finding.description || 'Açıklama belirtilmemiş' }}</p>
                      <p v-if="finding.location_note" class="mt-1 truncate text-xs text-gray-400">{{ finding.location_note }}</p>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ categoryLabels[finding.category] }}</td>
                    <td class="px-4 py-4"><span :class="['inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold', severityClass(finding.severity)]">{{ severityLabels[finding.severity] }}</span></td>
                    <td class="px-4 py-4"><span :class="['inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold', statusClass(finding.status)]">{{ statusLabels[finding.status] }}</span></td>
                    <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ finding.reported_by_user?.name || '—' }}</td>
                    <td class="whitespace-nowrap px-4 py-4 text-xs text-gray-400">{{ formatDate(finding.created_at) }}</td>
                    <td class="px-6 py-4 text-right"><button type="button" class="text-xs font-semibold text-brand-500 opacity-0 transition-opacity group-hover:opacity-100">Detay</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-between border-t border-gray-100 px-6 py-3 dark:border-gray-800">
              <p class="text-xs text-gray-400">{{ filteredFindings.length }} bulgu gösteriliyor</p>
              <span class="text-xs text-gray-400">{{ context.locationName }} / {{ context.branchName }}</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">Yönlendiriliyor...</div>
</template>
