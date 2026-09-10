<script setup lang="ts">
import { Calendar, CheckCircle2, ChevronRight, Clock, FileText, LoaderCircle, Trash2, Upload, XCircle } from '@lucide/vue'
import { emergencyEquipmentAnnualControlApi } from '~/api/emergency-equipment-annual-control'
import type { YscAnnualControlEquipmentInput, YscAnnualControlReport } from '~/types/ysc-annual-control'
import type { LocationEmergencyEquipmentItem } from '~/types/location-emergency-equipment'
import type { AmbiguousMatchResolution } from '~/components/isg/AmbiguousMatchCard.vue'
import type { MatchBucket, MatchRow } from '~/components/isg/IsgMatchResultsTable.vue'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const reports = ref<YscAnnualControlReport[]>([])
const loading = ref(false)

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const { data } = await emergencyEquipmentAnnualControlApi.list(context.branchId)
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
const uygunCount = computed(() => currentReports.value.filter(r => r.result === 'uygun').length)
const uygunDegilCount = computed(() => currentReports.value.filter(r => r.result === 'uygun_degil').length)
const yaklasanCount = computed(() => {
  const now = Date.now()
  const in30 = now + 30 * 24 * 60 * 60 * 1000
  return currentReports.value.filter((r) => {
    if (!r.next_control_date) return false
    const t = new Date(r.next_control_date).getTime()
    return t >= now && t <= in30
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
const removeReport = async (report: YscAnnualControlReport) => {
  if (!window.confirm(`${formatDate(report.control_date)} tarihli raporu silmek istediğinize emin misiniz? (Ekipman kayıtları etkilenmez)`)) return
  deletingId.value = report.id
  try {
    await emergencyEquipmentAnnualControlApi.remove(report.id)
    $toast.success('Rapor silindi.')
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Rapor silinemedi.')
  } finally {
    deletingId.value = null
  }
}

// =====================================================================
// Rapor Yükleme Sihirbazı — Fire Suppression ile aynı paylaşılan
// component'ler (IsgReportUploadStepper/FileDropzone/AnalyzingProgress/
// MatchResultsTable + AmbiguousMatchCard), sadece YSC'nin daha basit veri
// modeline (equipment[]: {id, result, note}) göre uyarlanmış orkestrasyon.
// =====================================================================
type WizardStage = 'upload' | 'analyzing' | 'matching' | 'confirm' | 'done'
const wizardStage = ref<WizardStage>('upload')
const wizardStageOrder: WizardStage[] = ['upload', 'analyzing', 'matching', 'confirm', 'done']
const wizardStepLabels = [
  { key: 'upload', number: 1, label: 'Dosya Yükle' },
  { key: 'analyzing', number: 2, label: 'AI Analizi' },
  { key: 'matching', number: 3, label: 'Eşleştirme' },
  { key: 'confirm', number: 4, label: 'Onayla' },
] as const
const currentStepNumber = computed(() => wizardStageOrder.indexOf(wizardStage.value) >= 3 ? 4 : wizardStageOrder.indexOf(wizardStage.value) + 1)

const drawerOpen = ref(false)
const saving = ref(false)
const selectedFile = ref<File | null>(null)
const savedReport = ref<YscAnnualControlReport | null>(null)

const form = ref({
  control_date: '',
  next_control_date: '',
  result: '' as '' | 'uygun' | 'uygun_degil',
  company_name: '',
  notes: '',
})

type EquipmentResultForm = { id: number; code: string | null; typeLabel: string | null; locationNote: string | null; result: 'uygun' | 'uygun_degil' | ''; note: string }
const equipmentResults = ref<EquipmentResultForm[]>([])

const matchRows = ref<MatchRow[]>([])
type AmbiguousEntry = {
  equipmentIndex: number
  code: string | null
  equipmentType: string | null
  capacity: string | null
  locationNote: string | null
  result: string | null
  note: string | null
  candidates: LocationEmergencyEquipmentItem[]
}
const ambiguousMatches = ref<AmbiguousEntry[]>([])
const ambiguousResolutions = ref<Record<number, AmbiguousMatchResolution>>({})

const resetWizard = () => {
  selectedFile.value = null
  savedReport.value = null
  matchRows.value = []
  ambiguousMatches.value = []
  ambiguousResolutions.value = {}
  equipmentResults.value = []
  matchingView.value = 'results'
  activeDetailIndex.value = null
  wizardStage.value = 'upload'
  form.value = { control_date: '', next_control_date: '', result: '', company_name: '', notes: '' }
}
const openUpload = () => { resetWizard(); drawerOpen.value = true }
const closeDrawer = () => { drawerOpen.value = false }

const equipmentLabel = (item: LocationEmergencyEquipmentItem) => item.equipment_type?.tip ?? item.equipment_type?.name ?? null
const equipmentCapacity = (item: LocationEmergencyEquipmentItem) => item.equipment_type?.capacity_kg ? `${item.equipment_type.capacity_kg} KG` : null

const upsertEquipmentResult = (item: LocationEmergencyEquipmentItem, result: string | null, note: string | null) => {
  const idx = equipmentResults.value.findIndex(e => e.id === item.id)
  const entry: EquipmentResultForm = {
    id: item.id,
    code: item.code ?? null,
    typeLabel: equipmentLabel(item),
    locationNote: item.location_note ?? null,
    result: result === 'uygun' || result === 'uygun_degil' ? result : '',
    note: note ?? '',
  }
  if (idx === -1) equipmentResults.value.push(entry)
  else equipmentResults.value[idx] = entry
}
const removeEquipmentResult = (id: number) => {
  equipmentResults.value = equipmentResults.value.filter(e => e.id !== id)
}

// --- Adım 1 + 2: Dosya Yükle + AI Analizi ---
const analyzingSteps = ref([
  { label: 'PDF dosyası yüklendi', done: false },
  { label: 'Metin çıkarılıyor...', done: false },
  { label: 'AI ile analiz ediliyor (biraz sürebilir)', done: false },
  { label: 'Envanter ile eşleştiriliyor', done: false },
])

const selectFile = (file: File) => {
  selectedFile.value = file
  runAnalyzing()
}

const runAnalyzing = async () => {
  if (!context.branchId || !selectedFile.value) return
  wizardStage.value = 'analyzing'
  analyzingSteps.value = analyzingSteps.value.map((s, i) => ({ ...s, done: i === 0 }))
  const step1Timer = window.setTimeout(() => { analyzingSteps.value[1].done = true }, 500)

  try {
    const { data: draft } = await emergencyEquipmentAnnualControlApi.analyze(context.branchId, selectedFile.value)

    if (draft.control_date) form.value.control_date = draft.control_date
    if (draft.next_control_date) form.value.next_control_date = draft.next_control_date
    if (draft.result) form.value.result = draft.result
    if (draft.company_name) form.value.company_name = draft.company_name

    const candidateItemsById = new Map((draft.candidate_inventory_items ?? []).map(item => [item.id, item]))
    const matchedById = new Map(draft.matched_inventory_items.map(item => [item.id, item]))

    const rows: MatchRow[] = []
    const ambiguous: AmbiguousEntry[] = []
    equipmentResults.value = []

    ;(draft.equipment ?? []).forEach((eq, equipmentIndex) => {
      const status = eq.match?.status ?? 'new'
      let bucket: MatchBucket = 'yeni'
      const categoryLabel = [eq.capacity, eq.equipment_type].filter(Boolean).join(' · ') || null

      if (status === 'exact' && eq.match?.matched_id) {
        bucket = 'kesin'
        const item = matchedById.get(eq.match.matched_id)
        if (item) upsertEquipmentResult(item, eq.result ?? null, eq.note ?? null)
      } else if (status === 'candidate_single') {
        bucket = 'kesin'
        const onlyId = eq.match?.candidate_ids?.[0]
        const item = onlyId ? candidateItemsById.get(onlyId) : null
        if (item) upsertEquipmentResult(item, eq.result ?? null, eq.note ?? null)
      } else if (status === 'candidate_multiple') {
        bucket = 'belirsiz'
        ambiguous.push({
          equipmentIndex,
          code: eq.code ?? null,
          equipmentType: eq.equipment_type ?? null,
          capacity: eq.capacity ?? null,
          locationNote: eq.location_note ?? null,
          result: eq.result ?? null,
          note: eq.note ?? null,
          candidates: (eq.match?.candidate_ids ?? []).map(id => candidateItemsById.get(id)).filter((i): i is LocationEmergencyEquipmentItem => !!i),
        })
      }

      rows.push({
        equipmentIndex,
        code: eq.code ?? null,
        categoryLabel,
        locationNote: eq.location_note ?? null,
        bucket,
      })
    })

    matchRows.value = rows
    ambiguousMatches.value = ambiguous
    ambiguousResolutions.value = {}

    analyzingSteps.value = analyzingSteps.value.map(s => ({ ...s, done: true }))
    await new Promise(resolve => setTimeout(resolve, 250))
    wizardStage.value = 'matching'
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'PDF analiz edilemedi.')
    wizardStage.value = 'upload'
  } finally {
    clearTimeout(step1Timer)
  }
}
const cancelAnalyzing = () => { wizardStage.value = 'upload'; selectedFile.value = null }

// --- Adım 3: Eşleştirme ---
const matchingView = ref<'results' | 'detail'>('results')
const activeDetailIndex = ref<number | null>(null)
const activeAmbiguousEntry = computed(() => ambiguousMatches.value.find(e => e.equipmentIndex === activeDetailIndex.value) ?? null)
const openDetail = (equipmentIndex: number) => { activeDetailIndex.value = equipmentIndex; matchingView.value = 'detail' }
const backToResults = () => { matchingView.value = 'results' }

const resolveAmbiguous = (entry: AmbiguousEntry, decision: AmbiguousMatchResolution) => {
  const previous = ambiguousResolutions.value[entry.equipmentIndex]
  if (previous?.action === 'match' && previous.candidateId) removeEquipmentResult(previous.candidateId)

  ambiguousResolutions.value = { ...ambiguousResolutions.value, [entry.equipmentIndex]: decision }

  if (decision.action === 'match' && decision.candidateId) {
    const item = entry.candidates.find(c => c.id === decision.candidateId)
    if (item) upsertEquipmentResult(item, entry.result, entry.note)
  }
  backToResults()
}
const resolutionLabel = (equipmentIndex: number): string | null => {
  const r = ambiguousResolutions.value[equipmentIndex]
  if (r?.action === 'match') return 'Eşleştirildi'
  if (r?.action === 'none') return 'Yeni Ekipman Adayı'
  return null
}
const goToConfirm = () => { wizardStage.value = 'confirm' }
const backToMatching = () => { wizardStage.value = 'matching'; matchingView.value = 'results' }

// --- Adım 4: Onayla ---
const submit = async () => {
  if (!context.branchId || !selectedFile.value || saving.value) return
  saving.value = true
  try {
    const equipment: YscAnnualControlEquipmentInput[] = equipmentResults.value.map(e => ({
      id: e.id,
      result: e.result || null,
      note: e.note || null,
    }))
    const { data: report } = await emergencyEquipmentAnnualControlApi.create(context.branchId, {
      control_date: form.value.control_date,
      next_control_date: form.value.next_control_date || null,
      result: form.value.result || null,
      company_name: form.value.company_name || null,
      notes: form.value.notes || null,
      file: selectedFile.value,
      equipment,
    })
    $toast.success('Yıllık kontrol raporu yüklendi.')
    savedReport.value = report
    wizardStage.value = 'done'
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Rapor yüklenemedi.')
  } finally {
    saving.value = false
  }
}

const doneStats = computed(() => ({
  total: matchRows.value.length,
  kesin: matchRows.value.filter(r => r.bucket === 'kesin').length,
  belirsizBirakilan: ambiguousMatches.value.filter(e => ambiguousResolutions.value[e.equipmentIndex]?.action !== 'match').length,
  yeni: matchRows.value.filter(r => r.bucket === 'yeni').length,
}))
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1500px]">
          <YscTabs active="annual-controls" />

          <section class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d71920]">YSC</div>
              <h1 class="text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#111827] dark:text-white">Yıllık Kontrol Raporları</h1>
              <p class="mt-1.5 text-[15px] text-[#64748b] dark:text-gray-400">Yangın söndürme cihazlarının yıllık periyodik kontrol raporları.</p>
            </div>
            <button type="button" class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d71920] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(215,25,32,0.18)] transition hover:bg-[#b9151b]" @click="openUpload">
              <Upload :size="18" stroke-width="2.5" />
              Rapor Yükle
            </button>
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
                <div v-for="report in currentReports" :key="report.id" class="rounded-xl border border-[#e7e9ed] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-3">
                      <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="20" /></span>
                      <div>
                        <p class="text-sm font-bold text-[#172033] dark:text-white">{{ formatDate(report.control_date) }}</p>
                        <p class="text-xs text-gray-400">{{ report.equipment_count ?? 0 }} ekipman</p>
                      </div>
                    </div>
                    <button type="button" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#d71920] dark:hover:bg-red-500/10" :disabled="deletingId === report.id" @click="removeReport(report)">
                      <LoaderCircle v-if="deletingId === report.id" :size="13" class="animate-spin" />
                      <Trash2 v-else :size="13" />
                    </button>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="resultMeta(report.result).cls">{{ resultMeta(report.result).label }}</span>
                    <span v-if="report.company_name" class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ report.company_name }}</span>
                  </div>
                  <p v-if="report.next_control_date" class="mt-3 flex items-center gap-1.5 text-xs text-gray-400"><Calendar :size="13" />Sonraki kontrol: {{ formatDate(report.next_control_date) }}</p>
                  <a :href="report.file_url" target="_blank" rel="noopener" class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#d71920]">PDF'i Görüntüle<ChevronRight :size="13" /></a>
                </div>
              </div>
            </section>

            <section v-if="archivedReports.length" class="mt-6">
              <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Geçmiş / Arşiv</p>
              <div class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                <div v-for="report in archivedReports" :key="report.id" class="flex items-center justify-between gap-3 border-b border-[#f1f2f4] px-4 py-3.5 last:border-0 dark:border-gray-800">
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5"><FileText :size="16" /></span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-[#172033] dark:text-white">{{ formatDate(report.control_date) }}</p>
                      <p class="truncate text-xs text-gray-400">{{ report.file_name }}</p>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-3">
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="resultMeta(report.result).cls">{{ resultMeta(report.result).label }}</span>
                    <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#d71920] dark:hover:bg-red-500/10" :disabled="deletingId === report.id" @click="removeReport(report)">
                      <LoaderCircle v-if="deletingId === report.id" :size="13" class="animate-spin" />
                      <Trash2 v-else :size="13" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </template>
        </div>
      </main>
    </div>

    <!-- Rapor yükleme sihirbazı -->
    <div v-if="drawerOpen" class="fixed inset-0 z-[10000] flex justify-end bg-black/30" @click.self="wizardStage === 'upload' && closeDrawer()">
      <div class="flex h-full w-full max-w-3xl flex-col bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p class="text-sm font-bold text-[#172033] dark:text-white">Yıllık Periyodik Kontrol Raporu Yükle</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeDrawer"><XCircle :size="16" /></button>
        </div>

        <IsgReportUploadStepper :steps="wizardStepLabels" :current-step="currentStepNumber" />

        <div class="flex-1 overflow-y-auto px-5 py-5">
          <IsgReportFileDropzone
            v-if="wizardStage === 'upload'"
            hint="Sadece yıllık periyodik kontrol raporları yüklenebilir. Dosya seçildiğinde analiz otomatik başlar."
            @select="selectFile"
          />

          <IsgReportAnalyzingProgress
            v-else-if="wizardStage === 'analyzing'"
            :file="selectedFile"
            :steps="analyzingSteps"
            @cancel="cancelAnalyzing"
          />

          <template v-else-if="wizardStage === 'matching'">
            <IsgMatchResultsTable
              v-if="matchingView === 'results'"
              :rows="matchRows"
              :resolution-label="resolutionLabel"
              @inspect="openDetail"
            />

            <AmbiguousMatchCard
              v-else-if="activeAmbiguousEntry"
              domain="ysc"
              :entry-key="activeAmbiguousEntry.equipmentIndex"
              :report-equipment="{
                code: activeAmbiguousEntry.code,
                equipmentType: activeAmbiguousEntry.equipmentType,
                capacity: activeAmbiguousEntry.capacity,
                locationNote: activeAmbiguousEntry.locationNote,
                result: activeAmbiguousEntry.result,
                note: activeAmbiguousEntry.note,
              }"
              :candidates="activeAmbiguousEntry.candidates.map(c => ({ id: c.id, code: c.code, equipmentType: equipmentLabel(c), capacity: equipmentCapacity(c), locationNote: c.location_note }))"
              :resolution="ambiguousResolutions[activeAmbiguousEntry.equipmentIndex] ?? null"
              @resolve="decision => resolveAmbiguous(activeAmbiguousEntry!, decision)"
              @back="backToResults"
            />
          </template>

          <template v-else-if="wizardStage === 'confirm'">
            <div class="space-y-6">
              <div>
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Rapor Bilgileri</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kontrol Tarihi</label>
                    <input v-model="form.control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Sonraki Kontrol</label>
                    <input v-model="form.next_control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  </div>
                </div>
                <div class="mt-3">
                  <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Genel Sonuç</label>
                  <select v-model="form.result" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                    <option value="">Belirtilmedi</option>
                    <option value="uygun">Uygun</option>
                    <option value="uygun_degil">Uygun Değil</option>
                  </select>
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Kapsanan Ekipmanlar ({{ equipmentResults.length }})</p>
                <div v-if="!equipmentResults.length" class="rounded-lg border border-dashed border-[#dfe3e8] p-4 text-center text-xs text-gray-400 dark:border-gray-700">Eşleşen ekipman yok.</div>
                <div v-else class="space-y-2">
                  <div v-for="eq in equipmentResults" :key="eq.id" class="rounded-lg border border-[#e7e9ed] p-3 dark:border-gray-800">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="text-xs font-medium text-gray-700 dark:text-gray-200"><span class="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ eq.code || '—' }}</span>{{ eq.typeLabel }}<span v-if="eq.locationNote"> · {{ eq.locationNote }}</span></p>
                      <div class="flex shrink-0 gap-1">
                        <button type="button" class="rounded-full px-2.5 py-1 text-[11px] font-semibold transition" :class="eq.result === 'uygun' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'" @click="eq.result = 'uygun'">Uygun</button>
                        <button type="button" class="rounded-full px-2.5 py-1 text-[11px] font-semibold transition" :class="eq.result === 'uygun_degil' ? 'bg-[#d71920] text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'" @click="eq.result = 'uygun_degil'">Uygun Değil</button>
                      </div>
                    </div>
                    <input v-if="eq.result === 'uygun_degil'" v-model="eq.note" type="text" placeholder="Tespit / açıklama" class="mt-2 h-9 w-full rounded-lg border border-[#dfe3e8] px-2.5 text-xs outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  </div>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kontrolü Yapan Firma</label>
                <input v-model="form.company_name" type="text" placeholder="Firma adı" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Notlar</label>
                <textarea v-model="form.notes" rows="2" class="w-full rounded-lg border border-[#dfe3e8] p-2.5 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800" />
              </div>
            </div>
          </template>

          <div v-else-if="wizardStage === 'done'" class="mx-auto flex max-w-md flex-col items-center py-10 text-center">
            <span class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 :size="32" /></span>
            <p class="text-lg font-bold text-[#172033] dark:text-white">Rapor başarıyla işlendi</p>
            <p class="mt-1 text-sm text-gray-400">Eşleştirme işlemleri kaydedildi. Envanter güncellendi.</p>

            <div class="mt-6 grid w-full grid-cols-2 gap-3">
              <div class="rounded-xl border border-[#e7e9ed] p-3 dark:border-gray-800">
                <p class="text-2xl font-bold text-[#172033] dark:text-white">{{ doneStats.total }}</p>
                <p class="text-xs text-gray-400">Toplam Kayıt</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] p-3 dark:border-gray-800">
                <p class="text-2xl font-bold text-emerald-600">{{ doneStats.kesin }}</p>
                <p class="text-xs text-gray-400">Kesin Eşleşen</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] p-3 dark:border-gray-800">
                <p class="text-2xl font-bold text-amber-600">{{ doneStats.belirsizBirakilan }}</p>
                <p class="text-xs text-gray-400">Belirsiz Bırakılan</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] p-3 dark:border-gray-800">
                <p class="text-2xl font-bold text-[#172033] dark:text-white">{{ doneStats.yeni }}</p>
                <p class="text-xs text-gray-400">Yeni Ekipman</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <template v-if="wizardStage === 'upload'">
            <button type="button" class="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="closeDrawer">Vazgeç</button>
          </template>
          <template v-else-if="wizardStage === 'matching' && matchingView === 'results'">
            <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="wizardStage = 'upload'; selectedFile = null">Geri</button>
            <button type="button" class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white" @click="goToConfirm">Onaya Geç<ChevronRight :size="15" /></button>
          </template>
          <template v-else-if="wizardStage === 'confirm'">
            <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="saving" @click="backToMatching">Geri</button>
            <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="saving || !form.control_date" @click="submit">
              <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
              Raporu Kaydet
            </button>
          </template>
          <template v-else-if="wizardStage === 'done'">
            <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="closeDrawer">Raporlar Sayfasına Dön</button>
            <button type="button" class="flex-1 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white" @click="resetWizard">Başka Rapor Yükle</button>
          </template>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
