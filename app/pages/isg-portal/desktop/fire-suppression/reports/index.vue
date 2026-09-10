<script setup lang="ts">
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Paperclip,
  Plus,
  Trash2,
  Upload,
  X,
  XCircle,
} from '@lucide/vue'
import { fireSuppressionReportApi } from '~/api/fire-suppression-report'
import { fireSuppressionInventoryApi } from '~/api/fire-suppression-inventory'
import {
  FIRE_SUPPRESSION_CATEGORIES,
  FIRE_SUPPRESSION_CATEGORY_LABELS,
  type FireSuppressionCategory,
  type FireSuppressionInventoryItem,
} from '~/types/fire-suppression-inventory'
import {
  FIRE_SUPPRESSION_CONTROL_ITEM_STATUS_LABELS,
  FIRE_SUPPRESSION_REPORT_FILE_TYPE_LABELS,
  type FireSuppressionControlItemStatus,
  type FireSuppressionFindingScope,
  type FireSuppressionReport,
  type FireSuppressionReportControlItemInput,
  type FireSuppressionReportFileInput,
  type FireSuppressionReportFileType,
  type FireSuppressionReportFindingInput,
} from '~/types/fire-suppression-report'
import type { AmbiguousMatchResolution } from '~/components/isg/AmbiguousMatchCard.vue'
import type { MatchBucket, MatchRow } from '~/components/isg/IsgMatchResultsTable.vue'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const reports = ref<FireSuppressionReport[]>([])
const inventoryItems = ref<FireSuppressionInventoryItem[]>([])
const loading = ref(false)

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const [reportsRes, itemsRes] = await Promise.all([
      fireSuppressionReportApi.list(context.branchId),
      fireSuppressionInventoryApi.list(context.branchId),
    ])
    reports.value = reportsRes.data
    inventoryItems.value = itemsRes.data
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

// =====================================================================
// Rapor Yükleme Sihirbazı — nihai akış: Dosya Yükle → AI Analizi →
// Eşleştirme (sonuç listesi ↔ tekil belirsiz inceleme) → Onayla → Tamamlandı.
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
const savedReport = ref<FireSuppressionReport | null>(null)

type FindingForm = FireSuppressionReportFindingInput
const emptyFinding = (): FindingForm => ({ category: null, control_item: '', description: '', scope: 'unknown', area_note: '', affected_item_ids: [] })

const form = ref({
  report_date: '',
  report_no: '',
  next_control_date: '',
  covered_categories: [] as FireSuppressionCategory[],
  overall_result: '' as '' | 'uygun' | 'uygun_degil',
  inspection_company_name: '',
  notes: '',
  covered_inventory_item_ids: [] as number[],
  findings: [] as FindingForm[],
})

const additionalFiles = ref<FireSuppressionReportFileInput[]>([])
const controlItemsForm = ref<FireSuppressionReportControlItemInput[]>([])
const loadingControlItems = ref(false)

const resetWizard = () => {
  selectedFile.value = null
  additionalFiles.value = []
  controlItemsForm.value = []
  savedReport.value = null
  matchRows.value = []
  ambiguousMatches.value = []
  ambiguousResolutions.value = {}
  newEquipmentDrafts.value = {}
  newEquipmentAdditions.value = {}
  matchingView.value = 'results'
  activeDetailIndex.value = null
  wizardStage.value = 'upload'
  form.value = {
    report_date: '',
    report_no: '',
    next_control_date: '',
    covered_categories: [],
    overall_result: '',
    inspection_company_name: '',
    notes: '',
    covered_inventory_item_ids: [],
    findings: [],
  }
}

const openUpload = () => {
  resetWizard()
  drawerOpen.value = true
}
const closeDrawer = () => { drawerOpen.value = false }

// --- Adım 1: Dosya Yükle ---
const selectFile = (file: File) => {
  selectedFile.value = file
  runAnalyzing()
}

// --- Adım 2: AI Analizi (görsel ilerleme + gerçek analyze() çağrısı) ---
const analyzingSteps = ref([
  { label: 'PDF dosyası yüklendi', done: false },
  { label: 'Metin çıkarılıyor...', done: false },
  { label: 'AI ile analiz ediliyor (biraz sürebilir)', done: false },
  { label: 'Envanter ile eşleştiriliyor', done: false },
])

const matchRows = ref<MatchRow[]>([])

type AmbiguousEntry = {
  equipmentIndex: number
  code: string | null
  categoryLabel: string | null
  brand: string | null
  model: string | null
  serialNo: string | null
  locationNote: string | null
  result: string | null
  candidates: FireSuppressionInventoryItem[]
}
const ambiguousMatches = ref<AmbiguousEntry[]>([])
const ambiguousResolutions = ref<Record<number, AmbiguousMatchResolution>>({})

// --- Yeni Ekipman (envanterde bulunamadı) — sessizce eklenmez, "Envantere
// Ekle" ile kullanıcı onayı alınır (bkz. IsgMatchResultsTable "yeni" bucket).
type NewEquipmentDraft = {
  category: FireSuppressionCategory | null
  code: string | null
  brand: string | null
  model: string | null
  serialNo: string | null
  locationNote: string | null
}
const newEquipmentDrafts = ref<Record<number, NewEquipmentDraft>>({})
const newEquipmentAdditions = ref<Record<number, FireSuppressionInventoryItem>>({})

const runAnalyzing = async () => {
  if (!context.branchId || !selectedFile.value) return
  wizardStage.value = 'analyzing'
  analyzingSteps.value = analyzingSteps.value.map((s, i) => ({ ...s, done: i === 0 }))
  // Sadece ilk iki adım (dosya yükleme + metin çıkarma) gerçekten hızlı ve
  // deterministik — otomatik ilerletiliyor. AI çağrısının süresi belirsiz
  // olduğu için 3. adım gerçek yanıt gelene kadar "devam ediyor" görünür.
  const step1Timer = window.setTimeout(() => { analyzingSteps.value[1].done = true }, 500)

  try {
    const { data: draft } = await fireSuppressionReportApi.analyze(context.branchId, selectedFile.value)

    if (draft.control_date) form.value.report_date = draft.control_date
    if (draft.next_control_date) form.value.next_control_date = draft.next_control_date
    if (draft.overall_result) form.value.overall_result = draft.overall_result
    if (draft.company_name) form.value.inspection_company_name = draft.company_name
    if (draft.covered_categories?.length) form.value.covered_categories = draft.covered_categories

    const matchedByCode = new Map(draft.matched_inventory_items.map(item => [item.code, item.id]))
    const candidateItemsById = new Map((draft.candidate_inventory_items ?? []).map(item => [item.id, item]))

    const coveredIds = new Set(draft.matched_inventory_items.map(item => item.id))
    const rows: MatchRow[] = []
    const ambiguous: AmbiguousEntry[] = []
    const newDrafts: Record<number, NewEquipmentDraft> = {}

    ;(draft.equipment ?? []).forEach((item, equipmentIndex) => {
      const status = item.match?.status ?? 'new'
      let bucket: MatchBucket = 'yeni'

      if (status === 'exact') {
        bucket = 'kesin'
      } else if (status === 'candidate_single') {
        bucket = 'kesin'
        const onlyCandidateId = item.match?.candidate_ids?.[0]
        if (onlyCandidateId) coveredIds.add(onlyCandidateId)
      } else if (status === 'candidate_multiple') {
        bucket = 'belirsiz'
        ambiguous.push({
          equipmentIndex,
          code: item.code ?? null,
          categoryLabel: item.category ? FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] : null,
          brand: item.brand ?? null,
          model: item.model ?? null,
          serialNo: item.serial_no ?? null,
          locationNote: item.location_note ?? null,
          result: item.result ?? null,
          candidates: (item.match?.candidate_ids ?? [])
            .map(id => candidateItemsById.get(id))
            .filter((i): i is FireSuppressionInventoryItem => !!i),
        })
      } else {
        bucket = 'yeni'
        newDrafts[equipmentIndex] = {
          category: item.category ?? null,
          code: item.code ?? null,
          brand: item.brand ?? null,
          model: item.model ?? null,
          serialNo: item.serial_no ?? null,
          locationNote: item.location_note ?? null,
        }
      }

      rows.push({
        equipmentIndex,
        code: item.code ?? null,
        categoryLabel: item.category ? FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] : null,
        locationNote: item.location_note ?? null,
        bucket,
      })
    })

    matchRows.value = rows
    ambiguousMatches.value = ambiguous
    ambiguousResolutions.value = {}
    newEquipmentDrafts.value = newDrafts
    newEquipmentAdditions.value = {}
    form.value.covered_inventory_item_ids = [...coveredIds]

    if (draft.findings?.length) {
      form.value.findings = draft.findings.map((f) => {
        const affectedIds = (f.equipment_codes ?? [])
          .map(code => matchedByCode.get(code))
          .filter((id): id is number => id !== undefined)
        return {
          category: f.category ?? null,
          control_item: f.control_item ?? '',
          description: f.description,
          scope: affectedIds.length ? 'specific' : f.scope,
          area_note: f.area_note ?? '',
          affected_item_ids: affectedIds,
        }
      })
    }

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

// --- Adım 3: Eşleştirme (sonuç listesi + tekil belirsiz inceleme) ---
const matchingView = ref<'results' | 'detail'>('results')
const activeDetailIndex = ref<number | null>(null)

const activeAmbiguousEntry = computed(() => ambiguousMatches.value.find(e => e.equipmentIndex === activeDetailIndex.value) ?? null)

const openDetail = (equipmentIndex: number) => {
  activeDetailIndex.value = equipmentIndex
  matchingView.value = 'detail'
}
const backToResults = () => { matchingView.value = 'results' }

const resolveAmbiguous = (entry: AmbiguousEntry, decision: AmbiguousMatchResolution) => {
  const previous = ambiguousResolutions.value[entry.equipmentIndex]
  if (previous?.action === 'match' && previous.candidateId) {
    const idx = form.value.covered_inventory_item_ids.indexOf(previous.candidateId)
    if (idx !== -1) form.value.covered_inventory_item_ids.splice(idx, 1)
  }

  ambiguousResolutions.value = { ...ambiguousResolutions.value, [entry.equipmentIndex]: decision }

  if (decision.action === 'match' && decision.candidateId && !form.value.covered_inventory_item_ids.includes(decision.candidateId)) {
    form.value.covered_inventory_item_ids.push(decision.candidateId)
  }

  backToResults()
}

const resolutionLabel = (equipmentIndex: number): string | null => {
  const r = ambiguousResolutions.value[equipmentIndex]
  if (r?.action === 'match') return 'Eşleştirildi'
  if (r?.action === 'none') return 'Yeni Ekipman Adayı'
  return null
}

// --- "Yeni Ekipman" onayı — envanterde bulunamayan ekipmanlar sessizce
// eklenmez, kullanıcı "Envantere Ekle" ile açıkça onaylar (kritik envanter
// değişikliği onaysız yapılmaz).
const newItemModalIndex = ref<number | null>(null)
const newItemForm = ref({ category: 'yangin_dolabi' as FireSuppressionCategory, code: '', brand: '', model: '', serial_no: '', location_note: '' })
const newItemSaving = ref(false)

const openNewItemModal = (equipmentIndex: number) => {
  const draft = newEquipmentDrafts.value[equipmentIndex]
  if (!draft) return
  newItemForm.value = {
    category: draft.category ?? 'yangin_dolabi',
    code: draft.code ?? '',
    brand: draft.brand ?? '',
    model: draft.model ?? '',
    serial_no: draft.serialNo ?? '',
    location_note: draft.locationNote ?? '',
  }
  newItemModalIndex.value = equipmentIndex
}
const closeNewItemModal = () => { newItemModalIndex.value = null }

const newItemLabel = (equipmentIndex: number): string | null => {
  const added = newEquipmentAdditions.value[equipmentIndex]
  return added ? `Envantere Eklendi: ${added.code || FIRE_SUPPRESSION_CATEGORY_LABELS[added.category]}` : null
}

const submitNewItem = async () => {
  if (!context.branchId || newItemModalIndex.value === null || newItemSaving.value) return
  newItemSaving.value = true
  try {
    const { data: item } = await fireSuppressionInventoryApi.create(context.branchId, {
      category: newItemForm.value.category,
      code: newItemForm.value.code || null,
      brand: newItemForm.value.brand || null,
      model: newItemForm.value.model || null,
      serial_no: newItemForm.value.serial_no || null,
      location_note: newItemForm.value.location_note || null,
    })
    newEquipmentAdditions.value = { ...newEquipmentAdditions.value, [newItemModalIndex.value]: item }
    if (!form.value.covered_inventory_item_ids.includes(item.id)) form.value.covered_inventory_item_ids.push(item.id)
    $toast.success('Envanter kaydı eklendi.')
    newItemModalIndex.value = null
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Envanter kaydı eklenemedi.')
  } finally {
    newItemSaving.value = false
  }
}

const goToConfirm = async () => {
  await syncControlItems()
  wizardStage.value = 'confirm'
}
const backToMatching = () => { wizardStage.value = 'matching'; matchingView.value = 'results' }

// --- Kontrol Maddeleri (checklist) — AI'ın belirlediği kapsanan kategorilere
// göre standart şablondan doldurulur, kullanıcı durumu/açıklamayı düzenler.
const syncControlItems = async () => {
  if (!form.value.covered_categories.length) {
    controlItemsForm.value = []
    return
  }
  loadingControlItems.value = true
  try {
    const { data: templates } = await fireSuppressionReportApi.controlItemTemplates(form.value.covered_categories)
    const existingByTemplateId = new Map(controlItemsForm.value.filter(c => c.template_id).map(c => [c.template_id, c]))
    controlItemsForm.value = templates.map(t => existingByTemplateId.get(t.id) ?? {
      template_id: t.id,
      category: t.category,
      code: t.code,
      section: t.section,
      title: t.title,
      status: 'uygun' as FireSuppressionControlItemStatus,
      description: '',
    })
  } catch {
    $toast.error('Kontrol maddeleri yüklenemedi.')
  } finally {
    loadingControlItems.value = false
  }
}
const controlItemsByCategory = computed(() => {
  const groups = new Map<FireSuppressionCategory, FireSuppressionReportControlItemInput[]>()
  for (const item of controlItemsForm.value) {
    if (!item.category) continue
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category)!.push(item)
  }
  return groups
})
const controlItemStatusOptions: FireSuppressionControlItemStatus[] = ['uygun', 'uygun_degil', 'uygulanamiyor']

// --- Ek dosyalar (Onayla adımında, opsiyonel) ---
const additionalFileInput = ref<HTMLInputElement | null>(null)
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const addAdditionalFiles = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  additionalFiles.value.push(...files.map((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const type: FireSuppressionReportFileType = IMAGE_EXTENSIONS.includes(ext) ? 'fotograf' : 'ek_belge'
    return { file, type, description: '' }
  }))
  ;(e.target as HTMLInputElement).value = ''
}
const removeAdditionalFile = (index: number) => { additionalFiles.value.splice(index, 1) }

const addFinding = () => { form.value.findings.push(emptyFinding()) }
const removeFinding = (index: number) => { form.value.findings.splice(index, 1) }
const itemsForCategory = (category?: FireSuppressionCategory | null) =>
  category ? inventoryItems.value.filter(i => i.category === category) : inventoryItems.value
const toggleCoveredItem = (id: number) => {
  const idx = form.value.covered_inventory_item_ids.indexOf(id)
  if (idx === -1) form.value.covered_inventory_item_ids.push(id)
  else form.value.covered_inventory_item_ids.splice(idx, 1)
}
const toggleFindingItem = (finding: FindingForm, id: number) => {
  finding.affected_item_ids ??= []
  const idx = finding.affected_item_ids.indexOf(id)
  if (idx === -1) finding.affected_item_ids.push(id)
  else finding.affected_item_ids.splice(idx, 1)
}

const scopeOptions: { value: FireSuppressionFindingScope; label: string }[] = [
  { value: 'all', label: 'Tüm Ekipmanlara Uygula' },
  { value: 'specific', label: 'Ekipman Seç' },
  { value: 'area', label: 'Alan Belirt' },
  { value: 'unknown', label: 'Belirsiz Olarak Kaydet' },
]

// --- Adım 4: Onayla → kaydet ---
const submit = async () => {
  if (!context.branchId || !selectedFile.value || saving.value) return
  saving.value = true
  try {
    const { data: report } = await fireSuppressionReportApi.create(context.branchId, {
      report_date: form.value.report_date,
      report_no: form.value.report_no || null,
      next_control_date: form.value.next_control_date || null,
      covered_categories: form.value.covered_categories,
      overall_result: form.value.overall_result || null,
      inspection_company_name: form.value.inspection_company_name || null,
      notes: form.value.notes || null,
      file: selectedFile.value,
      covered_inventory_item_ids: form.value.covered_inventory_item_ids,
      findings: form.value.findings
        .filter(f => f.description.trim())
        .map(f => ({
          category: f.category || null,
          control_item: f.control_item || null,
          description: f.description,
          scope: f.scope,
          area_note: f.scope === 'area' ? (f.area_note || null) : null,
          affected_item_ids: f.scope === 'specific' ? f.affected_item_ids : [],
        })),
      control_items: controlItemsForm.value,
      additional_files: additionalFiles.value,
    })
    $toast.success('Rapor yüklendi.')
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
  belirsizBirakilan: Object.values(ambiguousResolutions.value).filter(r => r.action === 'ambiguous').length
    + ambiguousMatches.value.filter(e => !ambiguousResolutions.value[e.equipmentIndex]).length,
  yeni: matchRows.value.filter(r => r.bucket === 'yeni').length + Object.values(ambiguousResolutions.value).filter(r => r.action === 'none').length,
}))
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

    <!-- Rapor yükleme sihirbazı -->
    <div v-if="drawerOpen" class="fixed inset-0 z-[10000] flex justify-end bg-black/30" @click.self="wizardStage === 'upload' && closeDrawer()">
      <div class="flex h-full w-full max-w-3xl flex-col bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p class="text-sm font-bold text-[#172033] dark:text-white">Yıllık Periyodik Kontrol Raporu Yükle</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeDrawer"><X :size="16" /></button>
        </div>

        <IsgReportUploadStepper :steps="wizardStepLabels" :current-step="currentStepNumber" />

        <div class="flex-1 overflow-y-auto px-5 py-5">
          <!-- Adım 1: Dosya Yükle -->
          <IsgReportFileDropzone
            v-if="wizardStage === 'upload'"
            hint="Sadece yıllık periyodik kontrol raporları yüklenebilir. Dosya seçildiğinde analiz otomatik başlar."
            @select="selectFile"
          />

          <!-- Adım 2: AI Analizi -->
          <IsgReportAnalyzingProgress
            v-else-if="wizardStage === 'analyzing'"
            :file="selectedFile"
            :steps="analyzingSteps"
            @cancel="cancelAnalyzing"
          />

          <!-- Adım 3: Eşleştirme -->
          <template v-else-if="wizardStage === 'matching'">
            <!-- Sonuç listesi -->
            <IsgMatchResultsTable
              v-if="matchingView === 'results'"
              :rows="matchRows"
              :resolution-label="resolutionLabel"
              :new-item-label="newItemLabel"
              @inspect="openDetail"
              @add-new="openNewItemModal"
            />

            <!-- Tekil belirsiz eşleşme detayı -->
            <AmbiguousMatchCard
              v-else-if="activeAmbiguousEntry"
              domain="fire_suppression"
              :entry-key="activeAmbiguousEntry.equipmentIndex"
              :report-equipment="{
                code: activeAmbiguousEntry.code,
                categoryLabel: activeAmbiguousEntry.categoryLabel,
                brand: activeAmbiguousEntry.brand,
                model: activeAmbiguousEntry.model,
                serialNo: activeAmbiguousEntry.serialNo,
                locationNote: activeAmbiguousEntry.locationNote,
                result: activeAmbiguousEntry.result,
              }"
              :candidates="activeAmbiguousEntry.candidates.map(c => ({ id: c.id, code: c.code, categoryLabel: FIRE_SUPPRESSION_CATEGORY_LABELS[c.category], brand: c.brand, model: c.model, serialNo: c.serial_no, locationNote: c.location_note }))"
              :resolution="ambiguousResolutions[activeAmbiguousEntry.equipmentIndex] ?? null"
              @resolve="decision => resolveAmbiguous(activeAmbiguousEntry!, decision)"
              @back="backToResults"
            />
          </template>

          <!-- Adım 4: Onayla -->
          <template v-else-if="wizardStage === 'confirm'">
            <div class="space-y-6">
              <div>
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Rapor Bilgileri</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Rapor Tarihi</label>
                    <input v-model="form.report_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Geçerlilik / Sonraki Kontrol Tarihi</label>
                    <input v-model="form.next_control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  </div>
                </div>
                <div class="mt-3">
                  <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kontrol Edilen Sistemler</label>
                  <div class="flex flex-wrap gap-2">
                    <label v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium" :class="form.covered_categories.includes(c) ? 'border-[#d71920] bg-red-50 text-[#d71920] dark:bg-red-500/10' : 'border-[#dfe3e8] text-gray-600 dark:border-gray-700 dark:text-gray-300'">
                      <input v-model="form.covered_categories" type="checkbox" :value="c" class="hidden" @change="syncControlItems">
                      {{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}
                    </label>
                  </div>
                </div>
                <div class="mt-3">
                  <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Genel Sonuç</label>
                  <select v-model="form.overall_result" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                    <option value="">Belirtilmedi</option>
                    <option value="uygun">Uygun</option>
                    <option value="uygun_degil">Uygun Değil</option>
                  </select>
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Kontrol Maddeleri</p>
                <div v-if="loadingControlItems" class="py-6 text-center text-xs text-gray-400">Yükleniyor...</div>
                <div v-else-if="!controlItemsForm.length" class="rounded-lg border border-dashed border-[#dfe3e8] p-4 text-center text-xs text-gray-400 dark:border-gray-700">Kontrol maddesi listesi için yukarıdan "Kontrol Edilen Sistemler" seçin.</div>
                <div v-else class="space-y-4">
                  <div v-for="[category, categoryItems] in controlItemsByCategory" :key="category">
                    <p class="mb-2 text-xs font-bold text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[category] }}</p>
                    <div class="space-y-2">
                      <div v-for="ci in categoryItems" :key="ci.template_id" class="rounded-lg border border-[#e7e9ed] p-3 dark:border-gray-800">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <p class="text-xs font-medium text-gray-700 dark:text-gray-200"><span v-if="ci.code" class="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ ci.code }}</span>{{ ci.title }}</p>
                          <div class="flex shrink-0 gap-1">
                            <button
                              v-for="status in controlItemStatusOptions"
                              :key="status"
                              type="button"
                              class="rounded-full px-2.5 py-1 text-[11px] font-semibold transition"
                              :class="ci.status === status
                                ? (status === 'uygun' ? 'bg-emerald-500 text-white' : status === 'uygun_degil' ? 'bg-[#d71920] text-white' : 'bg-gray-500 text-white')
                                : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'"
                              @click="ci.status = status"
                            >
                              {{ FIRE_SUPPRESSION_CONTROL_ITEM_STATUS_LABELS[status] }}
                            </button>
                          </div>
                        </div>
                        <input v-if="ci.status !== 'uygun'" v-model="ci.description" type="text" placeholder="Tespit / açıklama" class="mt-2 h-9 w-full rounded-lg border border-[#dfe3e8] px-2.5 text-xs outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div class="mb-3 flex items-center justify-between">
                  <p class="text-xs font-bold uppercase tracking-wide text-gray-400">Uygunsuzluklar (Opsiyonel)</p>
                  <button type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-[#d71920]" @click="addFinding"><Plus :size="13" />Ekle</button>
                </div>
                <div v-if="!form.findings.length" class="rounded-lg border border-dashed border-[#dfe3e8] p-4 text-center text-xs text-gray-400 dark:border-gray-700">Uygunsuzluk yoksa boş bırakabilirsiniz.</div>
                <div v-for="(finding, index) in form.findings" :key="index" class="mb-3 rounded-lg border border-[#e7e9ed] p-3.5 dark:border-gray-800">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-xs font-semibold text-gray-500">Uygunsuzluk {{ index + 1 }}</span>
                    <button type="button" class="text-gray-400 hover:text-[#d71920]" @click="removeFinding(index)"><X :size="14" /></button>
                  </div>
                  <textarea v-model="finding.description" rows="2" placeholder="Açıklama" class="mb-2 w-full rounded-lg border border-[#dfe3e8] p-2.5 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800" />
                  <div class="mb-2 grid grid-cols-2 gap-2">
                    <select v-model="finding.category" class="h-9 rounded-lg border border-[#dfe3e8] bg-white px-2 text-xs outline-none dark:border-gray-700 dark:bg-gray-800">
                      <option :value="null">Kategori seç</option>
                      <option v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" :value="c">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</option>
                    </select>
                    <input v-model="finding.control_item" type="text" placeholder="Kontrol maddesi (örn. D.9)" class="h-9 rounded-lg border border-[#dfe3e8] px-2 text-xs outline-none dark:border-gray-700 dark:bg-gray-800">
                  </div>
                  <div class="mb-2">
                    <p class="mb-1.5 text-[11px] font-semibold text-gray-500">Kapsam</p>
                    <div class="flex flex-wrap gap-1.5">
                      <label v-for="opt in scopeOptions" :key="opt.value" class="flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium" :class="finding.scope === opt.value ? 'border-[#d71920] bg-red-50 text-[#d71920] dark:bg-red-500/10' : 'border-[#dfe3e8] text-gray-600 dark:border-gray-700 dark:text-gray-300'">
                        <input v-model="finding.scope" type="radio" :value="opt.value" class="hidden">
                        {{ opt.label }}
                      </label>
                    </div>
                  </div>
                  <div v-if="finding.scope === 'area'">
                    <input v-model="finding.area_note" type="text" placeholder="Alan (örn. 1. Kat)" class="h-9 w-full rounded-lg border border-[#dfe3e8] px-2 text-xs outline-none dark:border-gray-700 dark:bg-gray-800">
                  </div>
                  <div v-if="finding.scope === 'specific'" class="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[#f1f2f4] p-2 dark:border-gray-800">
                    <label v-for="item in itemsForCategory(finding.category)" :key="item.id" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <input type="checkbox" :checked="finding.affected_item_ids?.includes(item.id)" @change="toggleFindingItem(finding, item.id)">
                      {{ item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}
                    </label>
                    <p v-if="!itemsForCategory(finding.category).length" class="text-[11px] text-gray-400">Bu kategoride kayıtlı ekipman yok.</p>
                  </div>
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Bu Raporda Kontrol Edilen Ekipmanlar</p>
                <div class="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-[#e7e9ed] p-3 dark:border-gray-800">
                  <label v-for="item in inventoryItems" :key="item.id" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <input type="checkbox" :checked="form.covered_inventory_item_ids.includes(item.id)" @change="toggleCoveredItem(item.id)">
                    {{ item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }} <span class="text-gray-400">({{ FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }})</span>
                  </label>
                  <p v-if="!inventoryItems.length" class="text-[11px] text-gray-400">Bu şubede envanter kaydı yok.</p>
                </div>
                <p class="mt-1.5 text-[11px] text-gray-400">AI eşleştirmesi + belirsiz eşleşme kararlarınız burada otomatik işaretlenmiştir; gerekirse elle düzenleyebilirsiniz.</p>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Ek Dosyalar (Opsiyonel)</p>
                <input ref="additionalFileInput" type="file" multiple accept="image/*,.doc,.docx,.xls,.xlsx,.zip,.pdf" class="hidden" @change="addAdditionalFiles">
                <button type="button" class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#dfe3e8] py-2.5 text-xs font-semibold text-gray-600 hover:border-[#d71920]/40 dark:border-gray-700 dark:text-gray-300" @click="additionalFileInput?.click()">
                  <Paperclip :size="14" class="text-[#d71920]" />Fotoğraf / Ek Belge Ekle
                </button>
                <div v-if="additionalFiles.length" class="mt-2 space-y-1.5">
                  <div v-for="(entry, index) in additionalFiles" :key="index" class="flex items-center gap-2 rounded-lg border border-[#e7e9ed] px-3 py-2 dark:border-gray-800">
                    <ImageIcon v-if="entry.type === 'fotograf'" :size="14" class="shrink-0 text-gray-400" />
                    <Paperclip v-else :size="14" class="shrink-0 text-gray-400" />
                    <span class="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{{ entry.file.name }}</span>
                    <span class="shrink-0 text-[10px] font-semibold text-gray-400">{{ FIRE_SUPPRESSION_REPORT_FILE_TYPE_LABELS[entry.type] }}</span>
                    <button type="button" class="shrink-0 text-gray-400 hover:text-[#d71920]" @click="removeAdditionalFile(index)"><X :size="14" /></button>
                  </div>
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Raporu Yapan Firma</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Rapor No</label>
                    <input v-model="form.report_no" type="text" placeholder="Örn. NT/23/1930-2/002" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Akredite Firma</label>
                    <input v-model="form.inspection_company_name" type="text" placeholder="Kontrolü yapan firma" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                  </div>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Notlar</label>
                <textarea v-model="form.notes" rows="2" class="w-full rounded-lg border border-[#dfe3e8] p-2.5 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800" />
              </div>
            </div>
          </template>

          <!-- Adım 5: Tamamlandı -->
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
            <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="saving || !form.report_date" @click="submit">
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

    <!-- Yeni Ekipman → Envantere Ekle onayı -->
    <div v-if="newItemModalIndex !== null" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30 p-4" @click.self="closeNewItemModal">
      <div class="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm font-bold text-[#172033] dark:text-white">Envantere Ekle</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeNewItemModal"><X :size="16" /></button>
        </div>
        <p class="mb-4 text-xs text-gray-400">Bu ekipman envanterinizde bulunamadı. Bilgileri kontrol edip onaylayın — onaylamadan envanter değişmez.</p>
        <div class="space-y-3">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kategori</label>
            <select v-model="newItemForm.category" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" :value="c">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Ekipman Kodu</label>
            <input v-model="newItemForm.code" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Marka</label>
              <input v-model="newItemForm.brand" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Model</label>
              <input v-model="newItemForm.model" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Seri No</label>
            <input v-model="newItemForm.serial_no" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Konum Notu</label>
            <input v-model="newItemForm.location_note" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
        </div>
        <div class="mt-5 flex gap-2">
          <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="newItemSaving" @click="closeNewItemModal">Vazgeç</button>
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="newItemSaving" @click="submitNewItem">
            <LoaderCircle v-if="newItemSaving" :size="15" class="animate-spin" />
            Envantere Ekle
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
