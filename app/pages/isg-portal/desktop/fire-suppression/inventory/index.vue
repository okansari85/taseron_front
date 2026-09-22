<script setup lang="ts">
import { fireSuppressionReportApi } from '~/api/fire-suppression-report'
import { fireSuppressionInventoryApi } from '~/api/fire-suppression-inventory'
import {
  FIRE_SUPPRESSION_CATEGORY_LABELS,
  type FireSuppressionCategory,
  type FireSuppressionInventoryItem,
} from '~/types/fire-suppression-inventory'
import type { FireSuppressionReport, FireSuppressionReportControlItem } from '~/types/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'
import { useFireSuppressionCategorySettings } from '~/composables/useFireSuppressionCategorySettings'
import {
  amountLabel,
  categoryIcon,
  daysRemaining,
  formatDate,
  statusClass,
  statusLabel,
} from '~/utils/fire-suppression/inventory'

import InventoryHeader from '~/components/fire-suppression/inventory/InventoryHeader.vue'
import InventoryOverview from '~/components/fire-suppression/inventory/InventoryOverview.vue'
import InventoryTabs from '~/components/fire-suppression/inventory/InventoryTabs.vue'
import InventorySystems from '~/components/fire-suppression/inventory/InventorySystems.vue'
import InventorySummaryCards from '~/components/fire-suppression/inventory/InventorySummaryCards.vue'
import InventoryAnalytics from '~/components/fire-suppression/inventory/InventoryAnalytics.vue'
import InventoryControls from '~/components/fire-suppression/inventory/InventoryControls.vue'
import InventoryFindings from '~/components/fire-suppression/inventory/InventoryFindings.vue'
import InventoryFiles from '~/components/fire-suppression/inventory/InventoryFiles.vue'
import InventoryAddModal from '~/components/fire-suppression/inventory/InventoryAddModal.vue'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()
const categorySettings = useFireSuppressionCategorySettings()

const report = ref<FireSuppressionReport | null>(null)
const components = ref<FireSuppressionInventoryItem[]>([])
const loading = ref(true)
const activeTab = ref('systems')
const showAddModal = ref(false)
const adding = ref(false)
const newCategory = ref<FireSuppressionCategory>('yangin_dolabi')
const newName = ref('')
const newCode = ref('')

const primaryColor = '#d71920'

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const [reportListRes, componentsRes] = await Promise.all([
      fireSuppressionReportApi.list(context.branchId),
      fireSuppressionInventoryApi.list(context.branchId),
    ])
    components.value = componentsRes.data

    const latest = reportListRes.data.find(r => r.is_current) ?? reportListRes.data[0] ?? null
    if (!latest) {
      report.value = null
      return
    }

    const { data } = await fireSuppressionReportApi.get(latest.id)
    report.value = data
  } catch {
    report.value = null
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
  categorySettings.load()
})

watch(() => context.branchId, load)

const CATEGORY_DISPLAY_LABELS: Partial<Record<string, string>> = {
  yangin_pompasi: 'Yangın Pompa Dairesi',
  yangin_dolabi: 'Yangın Dolapları',
  hidrant: 'Hidrant Sistemi',
  sprinkler: 'Sprinkler Sistemi',
  su_deposu: 'Yangın Su Deposu',
  sabit_boru: 'Sabit Boru Tesisatı',
  su_alma_verme: 'İtfaiye Su Alma ve Verme Ağızları',
  gazli_sondurme: 'Gazlı Söndürme',
  yangin_algilama: 'Yangın Algılama ve Uyarı Sistemleri',
}

const categoryLabel = (category: string) =>
  CATEGORY_DISPLAY_LABELS[category] || categorySettings.label(category) || FIRE_SUPPRESSION_CATEGORY_LABELS[category as FireSuppressionCategory] || category

type SystemSummary = {
  category: string
  items: FireSuppressionReportControlItem[]
  registeredCount: number
  unitCount: number
  unitsNonconform: number
  controlItemCount: number
  nonconformCount: number
  status: 'uygun' | 'uygun_degil' | null
  pumpBreakdown: { main: number; jokey: number } | null
}

const systemSummaries = computed<SystemSummary[]>(() => {
  const byCategory = new Map<string, FireSuppressionReportControlItem[]>()
  for (const item of report.value?.control_items ?? []) {
    const category = item.category ?? 'diger'
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category)!.push(item)
  }

  const registeredByCategory = new Map<string, number>()
  const present = new Set<string>()
  const children = new Map<string, FireSuppressionInventoryItem[]>()

  for (const item of components.value) {
    present.add(item.category)
    if (!item.code) continue
    registeredByCategory.set(item.category, (registeredByCategory.get(item.category) ?? 0) + 1)
    if (!children.has(item.category)) children.set(item.category, [])
    children.get(item.category)!.push(item)
  }

  return [...present].map((category) => {
    const items = byCategory.get(category) ?? []
    const registeredCount = registeredByCategory.get(category) ?? 0
    const pumpChildren = children.get(category) ?? []
    const pumpBreakdown = category === 'yangin_pompasi'
      ? {
          main: pumpChildren.filter(item => !(item.code ?? '').toLocaleLowerCase('tr-TR').includes('jokey')).length,
          jokey: pumpChildren.filter(item => (item.code ?? '').toLocaleLowerCase('tr-TR').includes('jokey')).length,
        }
      : null

    if (!items.length) {
      return { category, items, registeredCount, unitCount: registeredCount, unitsNonconform: 0, controlItemCount: 0, nonconformCount: 0, status: null, pumpBreakdown }
    }

    const codes = [...new Set(items.map(item => item.equipment_code).filter((v): v is string => !!v))]
    const nonconformUnits = codes.filter(code => items.some(item => item.equipment_code === code && item.status === 'uygun_degil')).length
    const controlCodes = [...new Set(items.map(item => item.code).filter((v): v is string => !!v))]
    const controlStatuses = controlCodes.length
      ? controlCodes.map(code => items.some(item => item.code === code && item.status === 'uygun_degil') ? 'uygun_degil' : 'uygun')
      : items.map(item => item.status === 'uygun_degil' ? 'uygun_degil' : 'uygun')

    return {
      category,
      items,
      registeredCount,
      unitCount: registeredCount > 0 ? registeredCount : codes.length,
      unitsNonconform: nonconformUnits,
      controlItemCount: controlStatuses.length,
      nonconformCount: controlStatuses.filter(status => status === 'uygun_degil').length,
      status: controlStatuses.includes('uygun_degil') ? 'uygun_degil' : 'uygun',
      pumpBreakdown,
    }
  })
})

const overallSummary = computed(() => {
  const suitable = systemSummaries.value.reduce((sum, item) => sum + item.controlItemCount - item.nonconformCount, 0)
  const unsuitable = systemSummaries.value.reduce((sum, item) => sum + item.nonconformCount, 0)
  const notApplicable = (report.value?.control_items ?? []).filter(item => item.status === 'uygulanamiyor').length
  return {
    systemCount: systemSummaries.value.length,
    totalUnits: systemSummaries.value.reduce((sum, item) => sum + item.unitCount, 0),
    controls: systemSummaries.value.reduce((sum, item) => sum + item.controlItemCount, 0),
    suitable,
    unsuitable,
    notApplicable,
  }
})

const maxNonconform = computed(() => Math.max(1, ...systemSummaries.value.map(item => item.nonconformCount)))

const overallStatus = computed(() => {
  if (report.value?.overall_result === 'uygun_degil') return 'Uygun Değil'
  if (report.value?.overall_result === 'uygun') return 'Uygun'
  if (overallSummary.value.unsuitable > 0) return 'Uygun Değil'
  if (report.value) return 'Uygun'
  return 'Rapor Yok'
})

const overallStatusClass = computed(() => {
  if (overallStatus.value === 'Uygun') return 'is-success'
  if (overallStatus.value === 'Rapor Yok') return 'is-neutral'
  return 'is-danger'
})

const suitablePercent = computed(() => {
  const total = overallSummary.value.controls
  return total ? Math.round((overallSummary.value.suitable / total) * 100) : 0
})

const unsuitablePercent = computed(() => {
  const total = overallSummary.value.controls
  return total ? Math.round((overallSummary.value.unsuitable / total) * 100) : 0
})

const noResultPercent = computed(() => Math.max(0, 100 - suitablePercent.value - unsuitablePercent.value))

const ringStyle = computed(() => ({
  background: `conic-gradient(#2dd488 0 ${suitablePercent.value}%, #ff4d52 ${suitablePercent.value}% ${suitablePercent.value + unsuitablePercent.value}%, #aeb9c8 ${suitablePercent.value + unsuitablePercent.value}% 100%)`,
}))

const latestControlLabel = computed(() => {
  if (!report.value?.report_date) return 'Henüz rapor yüklenmedi'
  return `${formatDate(report.value.report_date)}${report.value.inspection_company_name ? ` · ${report.value.inspection_company_name}` : ''}`
})

const facilityInfo = computed(() => {
  const tank = components.value.find(item => item.category === 'su_deposu')
  const sprinkler = components.value.find(item => item.category === 'sprinkler')
  const suppressionType = components.value.some(item => ['sprinkler', 'hidrant', 'yangin_dolabi'].includes(item.category)) ? 'Sulu' : '—'
  return [
    { label: 'Söndürme Sistemi', value: suppressionType },
    { label: 'Su Deposu Kapasitesi', value: tank?.display_name || tank?.notes || '—' },
    { label: 'Sprinkler Tipi', value: sprinkler?.display_name || sprinkler?.notes || '—' },
    { label: 'Bina Kullanım Amacı', value: '—' },
    { label: 'Bina / Yapı Yüksekliği', value: '—' },
    { label: 'Toplam Kapalı Alan', value: '—' },
    { label: 'Yangın Tehlike Sınıfı', value: '—' },
  ]
})

const goToTab = (tab: string, anchor: string) => {
  activeTab.value = tab
  nextTick(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

const addSystem = async () => {
  if (!context.branchId) return
  adding.value = true
  try {
    await fireSuppressionInventoryApi.create(context.branchId, {
      category: newCategory.value,
      display_name: newName.value.trim() || null,
      code: newCode.value.trim() || null,
    })
    showAddModal.value = false
    newName.value = ''
    newCode.value = ''
    await load()
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div v-if="context.ready" class="min-h-screen w-full bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen w-full transition-[padding] duration-300', isExpanded ? 'lg:pl-[240px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

     <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1400px]">
          <InventoryHeader
            :primary-color="primaryColor"
            @open-add="showAddModal = true"
          />

          <InventoryOverview
            :report="report"
            :overall-status="overallStatus"
            :overall-status-class="overallStatusClass"
            :latest-control-label="latestControlLabel"
            :primary-color="primaryColor"
            :format-date="formatDate"
            :days-remaining="daysRemaining"
          />

          <InventoryTabs
            :active-tab="activeTab"
            :primary-color="primaryColor"
            @change="goToTab"
          />

          <InventorySystems
            :loading="loading"
            :system-summaries="systemSummaries"
            :category-icon="categoryIcon"
            :category-label="categoryLabel"
            :amount-label="amountLabel"
            :status-label="statusLabel"
            :status-class="statusClass"
            :primary-color="primaryColor"
          />

          <InventorySummaryCards :overall-summary="overallSummary" />

          <InventoryAnalytics
            :overall-summary="overallSummary"
            :suitable-percent="suitablePercent"
            :unsuitable-percent="unsuitablePercent"
            :no-result-percent="noResultPercent"
            :ring-style="ringStyle"
            :system-summaries="systemSummaries"
            :max-nonconform="maxNonconform"
            :category-label="categoryLabel"
            :facility-info="facilityInfo"
          />

          <InventoryControls
            :report="report"
            :controls="overallSummary.controls"
            :primary-color="primaryColor"
          />

          <InventoryFindings
            :report="report"
            :primary-color="primaryColor"
          />

          <InventoryFiles
            :report="report"
            :primary-color="primaryColor"
          />
        </div>
      </main>
    </div>

    <InventoryAddModal
      v-model:open="showAddModal"
      v-model:category="newCategory"
      v-model:name="newName"
      v-model:code="newCode"
      :adding="adding"
      :primary-color="primaryColor"
      @submit="addSystem"
    />
  </div>
</template>
