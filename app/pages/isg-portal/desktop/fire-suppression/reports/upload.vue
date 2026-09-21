<script setup lang="ts">
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  Paperclip,
  Plus,
  X,
} from '@lucide/vue'
import { fireSuppressionReportApi, type FireSuppressionAnalysisProgress, type GeminiFixtureSummary } from '~/api/fire-suppression-report'
import { emergencyEquipmentAnnualControlApi } from '~/api/emergency-equipment-annual-control'
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
  type FireSuppressionReportAnalysisDraft,
  type FireSuppressionReportControlItemInput,
  type FireSuppressionReportEquipmentInput,
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

// Bu sihirbaz eskiden Raporlar sayfasının üstünde bir drawer (sağdan açılan
// panel) olarak çalışıyordu — hem çok adımlı/uzun bir akış için dar kaldı
// hem de arka planda listenin kesilmesi kafa karıştırıyordu. Artık kendi
// URL'i olan AYRI BİR SAYFA (bkz. mimari not: statik "upload.vue" rotası,
// "[id].vue" dinamik rotasının ÖNÜNE geçer, Nuxt/vue-router'da standart
// davranış — bu repoda "locations/new-branch.vue" ile aynı desen).
const goToReportsList = () => navigateTo('/isg-portal/desktop/fire-suppression/reports')

const inventoryItems = ref<FireSuppressionInventoryItem[]>([])

const loadInventoryItems = async () => {
  if (!context.branchId) return
  const { data } = await fireSuppressionInventoryApi.list(context.branchId)
  inventoryItems.value = data
}

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
    return
  }
  loadInventoryItems()
})

watch(() => context.branchId, loadInventoryItems)

// =====================================================================
// Rapor Yükleme Sihirbazı — nihai akış: Dosya Yükle → AI Analizi →
// Eşleştirme (sonuç listesi ↔ tekil belirsiz inceleme) → Onayla → Tamamlandı.
// =====================================================================
// 'fixture' GEÇİCİ bir adım (bkz. AnalyzeFireSuppressionReportJob $fixtureId) —
// gerçek dosya yükleyip Gemini'ye tekrar tekrar istek atmadan, kayıtlı bir
// Gemini fixture'ı seçerek Camelot/eşleştirme akışını test etmek için. Görsel
// olarak "Dosya Yükle" adımının bir alt durumu (aynı step numarası).
type WizardStage = 'upload' | 'fixture' | 'analyzing' | 'matching' | 'confirm' | 'done'
const wizardStage = ref<WizardStage>('upload')
const wizardStepLabels = [
  { key: 'upload', number: 1, label: 'Dosya Yükle' },
  { key: 'analyzing', number: 2, label: 'AI Analizi' },
  { key: 'matching', number: 3, label: 'Eşleştirme' },
  { key: 'confirm', number: 4, label: 'Onayla' },
] as const
const stepNumberByStage: Record<WizardStage, number> = { upload: 1, fixture: 1, analyzing: 2, matching: 3, confirm: 4, done: 4 }
const currentStepNumber = computed(() => stepNumberByStage[wizardStage.value])

const saving = ref(false)
const selectedFile = ref<File | null>(null)
const savedReport = ref<{ id: number } | null>(null)

// --- GEÇİCİ test modu: kayıtlı Gemini fixture'ı ile devam et ---
const fixtures = ref<GeminiFixtureSummary[]>([])
const fixturesLoading = ref(false)
const selectedFixtureId = ref('')
const loadFixtures = async () => {
  if (!context.branchId) return
  fixturesLoading.value = true
  try {
    const { data } = await fireSuppressionReportApi.listGeminiFixtures(context.branchId)
    fixtures.value = data
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Fixture listesi alınamadı.')
  } finally {
    fixturesLoading.value = false
  }
}
const goToFixtureStep = () => { wizardStage.value = 'fixture'; loadFixtures() }
const runAnalyzingFromFixture = async () => {
  if (!context.branchId || !selectedFixtureId.value) return
  wizardStage.value = 'analyzing'
  try {
    await fireSuppressionReportApi.analyzeFromFixture(context.branchId, selectedFixtureId.value)
    // "Raporu Kaydet" adımı normalde gerçek bir dosya (selectedFile) bekler -
    // fixture akışında kullanıcı hiç dosya seçmediği için PDF'i buradan
    // indirmek yerine backend'e fixtureId gönderiyoruz (bkz. submit()):
    // sunucu zaten kendi diskinde duran fixture PDF'ini indirme/tekrar
    // yükleme turu olmadan doğrudan kullanıyor.
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Fixture ile analiz başlatılamadı.')
    wizardStage.value = 'fixture'
  }
}

// _systemName backend'e HİÇ gönderilmez (submit() sadece belirli alanları
// seçip gönderir) - sadece kategori "diger" (Diğer) genel kovasına düşüp
// kullanıcı sonradan gerçek kategoriyi seçtiğinde bu bulgunun kategorisini
// de düzeltebilmek için saklanır (bkz. applyCategoryOverridesAndContinue).
type FindingForm = FireSuppressionReportFindingInput & { _systemName?: string | null }
const emptyFinding = (): FindingForm => ({ category: null, control_item: '', description: '', scope: 'unknown', area_note: '', affected_item_ids: [], equipment_codes: [], _systemName: null })

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
const equipmentPayload = ref<FireSuppressionReportEquipmentInput[]>([])

const resetWizard = () => {
  selectedFile.value = null
  additionalFiles.value = []
  controlItemsForm.value = []
  equipmentPayload.value = []
  savedReport.value = null
  selectedFixtureId.value = ''
  matchRows.value = []
  ambiguousMatches.value = []
  ambiguousResolutions.value = {}
  newEquipmentApprovals.value = {}
  detectedNewCategories.value = []
  newCategoryApprovals.value = {}
  equipmentDraftItems.value = []
  systemsDraftItems.value = []
  reportCategory.value = null
  aiOverallResultText.value = null
  expandedEquipmentCodes.value = new Set()
  expandedSystemCategories.value = new Set()
  matchingView.value = 'results'
  activeDetailIndex.value = null
  confirmTab.value = 'info'
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

// --- Adım 1: Dosya Yükle ---
const selectFile = (file: File) => {
  selectedFile.value = file
  runAnalyzing()
}

// --- Adım 2: AI Analizi — gerçek analyze() çağrısı, ilerleme
// IsgReportAnalyzingProgress'in kendi polling'inden gelen gerçek
// aşama/etiket verisiyle gösterilir (bkz. o bileşen).
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

// "Yeni" (envanterde hiç karşılığı olmayan) ekipmanlar için onay durumu —
// rapor tek başına envanter için kaynak sayılamaz ("raporda geçiyor" ≠
// "tesisatta var"), bu yüzden her yeni ekipman KULLANICI ONAYIYLA envantere
// eklenir. Varsayılan onaylı (true) gelir — sihirbaz analiz sonucunu zaten
// gösteriyor, kullanıcı istemediğini işaretinden çıkarır (bkz.
// buildControlItemsFromDraft: onaysız olanların kontrol maddeleri backend'e
// hiç gönderilmez, dolayısıyla ne envantere eklenir ne de rapora işlenir).
const newEquipmentApprovals = ref<Record<number, boolean>>({})
const isNewItemApproved = (equipmentIndex: number): boolean => newEquipmentApprovals.value[equipmentIndex] ?? true
const toggleNewItemApproval = (equipmentIndex: number) => {
  newEquipmentApprovals.value = { ...newEquipmentApprovals.value, [equipmentIndex]: !isNewItemApproved(equipmentIndex) }
}

// --- "Ana başlık" (sistem/kategori) seviyesinde yeni sistem tespiti ---
// Yukarıdaki newEquipmentApprovals TEK TEK ekipmanlar (YD14, Pompa 1 gibi)
// içindir — Su Deposu, Sabit Boru gibi "whole_unit" kategoriler çoğu
// raporda kendi kod/marka sütunlu bir ekipman TABLOSU olarak hiç geçmez
// (bkz. backend AI prompt notu: equipment kaydı sadece gerçek bir ekipman
// tablosundan türetilir), bu yüzden bu kategoriler AI'ın equipment[]
// çıkarımına hiç girmeyebilir ve yukarıdaki mekanizmadan tamamen kaçabilir.
// Bunun yerine draft.covered_categories'i (raporun AI tarafından genel
// olarak, format bağımsız çıkarılan "bu rapor hangi sistemleri kapsıyor"
// listesi — tek tek ekipman tablosu ARANMAZ) bu şubenin ZATEN KAYITLI
// kategorileriyle karşılaştırıp raporda geçip envanterde olmayan HER
// kategori için ayrı, açık bir "envantere eklensin mi?" onayı isteriz.
// Varsayılan onaylı (bkz. section 12/26 kararı — "varsayılan işaretli,
// kullanıcı isterse kaldırır"), backend bu liste olmadan (bkz.
// approved_new_categories) hiçbir whole_unit kaydı otomatik açmaz.
const detectedNewCategories = ref<FireSuppressionCategory[]>([])
const newCategoryApprovals = ref<Record<string, boolean>>({})
const isNewCategoryApproved = (category: FireSuppressionCategory): boolean => newCategoryApprovals.value[category] ?? true
const toggleNewCategoryApproval = (category: FireSuppressionCategory) => {
  newCategoryApprovals.value = { ...newCategoryApprovals.value, [category]: !isNewCategoryApproved(category) }
}
const normalizeSystemName = (s: string) => s.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')

// Backend bir sistemi kesin bir kategoriye oturtamazsa "diger" (Diğer) genel
// kovasına düşürür - "Yeni Sistemler" listesinde sadece "Diğer" yazması
// kullanıcıya hangi sistem olduğunu göstermez. Ayrıca hiçbir zaman körü
// körüne başka bir kategoriye de gömülmez (aynı raporda ayrı bir bölümse
// ayrı kalır) - ve savunmacı olarak, backend'in hiç beklenmeyen/bilinmeyen
// bir kategori değeri üretmesi ihtimaline karşı da (label haritasında hiç
// karşılığı olmayan HERHANGİ bir değer) aynı "çözülmemiş" muamelesi görür,
// asla boş gösterilmez. Bu map, kullanıcının modalde SEÇTİĞİ gerçek
// kategoriyi (rapor sistem adına göre) tutar; İleri tuşuna basılınca
// uygulanır (equipmentDraftItems/systemsDraftItems/findings üzerinde
// category alanı düzeltilir).
const categoryOverrides = ref<Record<string, FireSuppressionCategory>>({})
const showCategoryOverrideModal = ref(false)
const categoryOverrideDrafts = ref<Record<string, FireSuppressionCategory | ''>>({})
const categoryNeedsResolution = (c: string): boolean => c === 'diger' || !(c in FIRE_SUPPRESSION_CATEGORY_LABELS)
// Kategorisi çözülememiş (diger ya da hiç tanınmayan), henüz kullanıcı
// tarafından çözülmemiş HAM rapor sistem adları - hem "Yeni Sistemler"
// listesinde italik gösterim hem modal için.
const unresolvedCategorySystemNames = computed(() => {
  if (!detectedNewCategories.value.some(categoryNeedsResolution)) return []
  const names = new Set<string>()
  for (const s of systemsDraftItems.value) {
    if (!categoryNeedsResolution(s.category) || !s.name) continue
    if (categoryOverrides.value[normalizeSystemName(s.name)]) continue
    names.add(s.name)
  }
  return [...names]
})

// AI'ın döndürdüğü ham equipment dizisi (control_items dahil) — "Onayla"
// adımında gerçek madde listesini kurmak için saklanıyor (bkz. buildControlItemsFromDraft).
const equipmentDraftItems = ref<NonNullable<FireSuppressionReportAnalysisDraft['equipment']>>([])
// Sistem seviyeli (equipment'a bağlı olmayan, scope='system') kontrol
// maddeleri draft.equipment'ta DEĞİL draft.systems[].control_items'te -
// "Belge ve Kayıt Kontrolleri" gibi hiç ekipmanı olmayan sistemlerin kendi
// maddeleri buradan gelir (bkz. buildControlItemsFromDraft).
const systemsDraftItems = ref<NonNullable<FireSuppressionReportAnalysisDraft['systems']>>([])
// AI'ın bu PDF için belirlediği rapor tipi - "Kaydet" adımında hangi
// backend'e gideceğini belirler (bkz. submit()).
const reportCategory = ref<FireSuppressionReportAnalysisDraft['report_category']>(null)
// Raporun kendi "SONUÇ VE KANAAT" paragrafı (AI'ın gerçekten okuduğu metin) -
// Uygunsuzluk (finding) olsun olmasın HER raporda vardır, bu yüzden
// Bulgular sekmesinde findings listesinden BAĞIMSIZ, her zaman gösterilir.
const aiOverallResultText = ref<string | null>(null)

// Geçici debug: analiz tamamlandığında frontend'e gelen JSON'u görmek için.
const aiRawResult = ref<unknown | null>(null)
const showAiRawResult = ref(false)

// analyze() artık taslağı senkron döndürmüyor — sadece işi kuyruğa atıp
// hemen dönüyor (bkz. backend Job). Gerçek sonuç, IsgReportAnalyzingProgress
// bileşeninin polling'i tamamlandığını bildirdiğinde (@completed) gelir.
const runAnalyzing = async () => {
  if (!context.branchId || !selectedFile.value) return
  wizardStage.value = 'analyzing'

  try {
    await fireSuppressionReportApi.analyze(context.branchId, selectedFile.value)
    // Adım 2 (analiz) burada BİTMİYOR — IsgReportAnalyzingProgress kendi
    // polling'iyle ilerlemeyi gösterip tamamlanınca onAnalysisCompleted'ı
    // tetikleyecek. wizardStage 'analyzing' olarak kalır.
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'PDF analiz başlatılamadı.')
    wizardStage.value = 'upload'
  }
}

const onAnalysisFailed = (message: string) => {
  $toast.error(message || 'PDF analiz edilemedi.')
  wizardStage.value = selectedFixtureId.value ? 'fixture' : 'upload'
}

const onAnalysisCompleted = (progressState: FireSuppressionAnalysisProgress) => {
  const draft = progressState.result
  aiRawResult.value = progressState.result
  showAiRawResult.value = false
  if (!draft) {
    onAnalysisFailed('Analiz sonucu alınamadı.')
    return
  }

  reportCategory.value = draft.report_category ?? null
  aiOverallResultText.value = draft.report?.overall_result_text ?? null

  try {
    if (draft.report?.report_date) form.value.report_date = draft.report.report_date
    if (draft.report?.next_control_date) form.value.next_control_date = draft.report.next_control_date
    if (draft.report?.overall_result) form.value.overall_result = draft.report.overall_result
    if (draft.report?.company_name) form.value.inspection_company_name = draft.report.company_name
    if (draft.report?.report_no) form.value.report_no = draft.report.report_no
    // Raporun resmi sonuç metnini Notlar alanına ön-doldur - AI zaten
    // okuyor, kullanıcı isterse düzenler/silebilir, ama boş bir "Notlar"
    // kutusuyla bu bilgi hiç saklanmadan kaybolmasın (bkz. aiOverallResultText,
    // Bulgular sekmesinde de ayrıca salt-okunur gösterilir).
    if (draft.report?.overall_result_text && !form.value.notes) form.value.notes = draft.report.overall_result_text
    if (draft.covered_categories?.length) form.value.covered_categories = draft.covered_categories

    // Rapor genelinin kapsadığı sistemler ile bu şubede ZATEN KAYITLI
    // kategoriler karşılaştırılır — sadece raporda geçip envanterde
    // karşılığı olmayan kategoriler kullanıcıya "eklensin mi?" diye sorulur.
    const registeredCategories = new Set(inventoryItems.value.map(i => i.category))
    detectedNewCategories.value = (draft.covered_categories ?? []).filter(c => !registeredCategories.has(c))
    newCategoryApprovals.value = Object.fromEntries(detectedNewCategories.value.map(c => [c, true]))

    equipmentDraftItems.value = draft.equipment ?? []
    systemsDraftItems.value = draft.systems ?? []

    const matchedByCode = new Map(draft.matched_inventory_items.map(item => [item.code, item.id]))
    const candidateItemsById = new Map((draft.candidate_inventory_items ?? []).map(item => [item.id, item]))

    const coveredIds = new Set(draft.matched_inventory_items.map(item => item.id))
    const rows: MatchRow[] = []
    const ambiguous: AmbiguousEntry[] = []

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
        // "Yeni" (sıfır aday) — kullanıcıdan onay BEKLENMEZ, backend rapor
        // kaydedilirken bu equipment_code'u otomatik olarak yeni bir Sistem
        // Bileşeni kaydı olarak açar (bkz. FireSuppressionReportService::create()).
        bucket = 'yeni'
      }

      rows.push({
        equipmentIndex,
        code: item.code ?? null,
        categoryLabel: item.category ? FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] : null,
        locationNote: item.location_note ?? null,
        properties: item.properties ?? null,
        bucket,
      })
    })

    matchRows.value = rows
    ambiguousMatches.value = ambiguous
    ambiguousResolutions.value = {}
    // "Yeni" ekipmanlar varsayılan olarak onaylı (eklenecek) başlar —
    // kullanıcı Eşleştirme adımında istemediğini işaretten çıkarabilir.
    newEquipmentApprovals.value = Object.fromEntries(
      rows.filter(r => r.bucket === 'yeni').map(r => [r.equipmentIndex, true]),
    )
    form.value.covered_inventory_item_ids = [...coveredIds]

    // Bulgunun 'category'si backend'den hiç gelmiyor - gelen sadece
    // system_name (raporun kendi sistem başlığı, örn. "Yangın Dolapları ve
    // Hortum Sistemlerinin Kontrolü"). draft.systems zaten AYNI adı
    // kategorisiyle birlikte taşıyor - bulgunun kategorisini oradan
    // eşleştirerek türetiyoruz, kullanıcının elle seçmesine gerek kalmadan.
    const categoryBySystemName = new Map((draft.systems ?? []).filter(s => s.name).map(s => [normalizeSystemName(s.name as string), s.category]))

    if (draft.findings?.length) {
      form.value.findings = draft.findings.map((f) => {
        const equipmentCodes = f.affected_equipment ?? []
        // Zaten mevcut envanterle eşleşmiş kodlar (matchedByCode) varsa
        // gerçek id'leri de gönderiyoruz (küçük bir optimizasyon - backend
        // zaten equipment_codes'tan da aynı sonuca ulaşır), ama asıl
        // bağlama artık equipment_codes üzerinden: backend kategori+kod
        // eşleşmesi bulamazsa YENİ bir Sistem Bileşeni açar (control_items'teki
        // AYNI mantık) - böylece henüz envanterde kayıtlı olmayan bir
        // ekipmana değinen bir bulgu da "eklensin" diye kullanıcıyı
        // uğraştırmadan doğru şekilde bağlanır/oluşturulur.
        const affectedIds = equipmentCodes
          .map(code => matchedByCode.get(code))
          .filter((id): id is number => id !== undefined)
        return {
          category: (f.system_name ? categoryBySystemName.get(normalizeSystemName(f.system_name)) : null) ?? null,
          _systemName: f.system_name ?? null,
          control_item: null,
          description: f.description,
          // equipment_codes doluysa doğrudan 'specific' - kullanıcıya hiç
          // sorulmaz, backend kod bazlı çözer/oluşturur. Boşsa (AI hiç
          // ekipman belirtmemiş) kullanıcıyı zorla kapsam seçtirmeden
          // 'unknown' (sadece bilgi amaçlı) atanır.
          scope: equipmentCodes.length ? 'specific' : 'unknown',
          area_note: '',
          affected_item_ids: affectedIds,
          equipment_codes: equipmentCodes,
        }
      })
    }

    matchingTab.value = reportCategory.value === 'ysc' ? 'components' : (detectedNewCategories.value.length ? 'new_systems' : 'systems')
    wizardStage.value = 'matching'
  } catch (e: any) {
    $toast.error(e?.message || 'Analiz sonucu işlenemedi.')
    wizardStage.value = selectedFixtureId.value ? 'fixture' : 'upload'
  }
}
const cancelAnalyzing = () => {
  // Fixture'dan mı yoksa gerçek dosyadan mı başladığımıza göre bir önceki
  // adıma dön (bkz. runAnalyzingFromFixture / runAnalyzing).
  wizardStage.value = selectedFixtureId.value ? 'fixture' : 'upload'
  selectedFile.value = null
}

// --- Adım 3: Eşleştirme (sonuç listesi + tekil belirsiz inceleme) ---
// Üç blok (Yeni Sistemler / Sistemler / Bileşenler) eskiden alt alta
// sıralıydı; kullanıcı bunları 3 ayrı sekme olarak istedi.
type MatchingTab = 'new_systems' | 'systems' | 'components'
const matchingTab = ref<MatchingTab>('systems')
// YSC (tüp) raporlarında "sistem" kavramı yok - AI'ın bu raporlar için hep
// tek bir YSC sistemi çıkarması, ona hiçbir zaman gerçek bir kategori
// oturmaması ("Diğer") ve tesisatın kendi kategori kavramının (dolap/pompa/
// hidrant) tüp için hiç geçerli olmaması nedeniyle "Yeni Sistemler"/
// "Sistemler" adımları anlamsız - doğrudan Bileşenler'e (tüp listesi) geçilir.
const matchingStepOrder = computed<MatchingTab[]>(() => reportCategory.value === 'ysc' ? ['components'] : ['new_systems', 'systems', 'components'])
const matchingStepLabels: Record<MatchingTab, string> = { new_systems: 'Yeni Sistemler', systems: 'Sistemler', components: 'Bileşenler' }
const matchingStepIndex = computed(() => matchingStepOrder.value.indexOf(matchingTab.value))
const matchingNext = () => {
  // "Yeni Sistemler" adımından çıkmadan önce, "diger" (Diğer) genel kovasına
  // düşmüş çözümlenmemiş sistem varsa kullanıcıyı zorla kategori seçtiren
  // modal açılır - aksi halde bu sistemler sonsuza kadar belirsiz "Diğer"
  // olarak kalır.
  if (matchingTab.value === 'new_systems' && unresolvedCategorySystemNames.value.length) {
    categoryOverrideDrafts.value = Object.fromEntries(unresolvedCategorySystemNames.value.map(n => [n, '']))
    showCategoryOverrideModal.value = true
    return
  }
  const next = matchingStepOrder.value[matchingStepIndex.value + 1]
  if (next) matchingTab.value = next
}
const applyCategoryOverridesAndContinue = () => {
  // Kod → sistem adı eşlemesi, henüz mutasyona uğramamış systemsDraftItems
  // üzerinden kurulur (equipmentDraftItems'ın kendisi sistem adını taşımaz,
  // sadece kategori taşır).
  const codeToSystemName = new Map<string, string>()
  for (const s of systemsDraftItems.value) {
    if (!s.name) continue
    for (const c of s.components ?? []) {
      if (c.code) codeToSystemName.set(c.code, s.name)
    }
  }

  for (const [name, category] of Object.entries(categoryOverrideDrafts.value)) {
    if (!category) continue
    categoryOverrides.value[normalizeSystemName(name)] = category
  }

  for (const s of systemsDraftItems.value) {
    if (!s.name) continue
    const override = categoryOverrides.value[normalizeSystemName(s.name)]
    if (override) s.category = override
  }
  for (const e of equipmentDraftItems.value) {
    if (e.category !== 'diger' || !e.code) continue
    const sysName = codeToSystemName.get(e.code)
    const override = sysName ? categoryOverrides.value[normalizeSystemName(sysName)] : undefined
    if (override) e.category = override
  }
  for (const f of form.value.findings) {
    if (f.category !== 'diger' || !f._systemName) continue
    const override = categoryOverrides.value[normalizeSystemName(f._systemName)]
    if (override) f.category = override
  }

  const registeredCategories = new Set(inventoryItems.value.map(i => i.category))
  const allCategories = new Set<FireSuppressionCategory>(form.value.covered_categories)
  for (const s of systemsDraftItems.value) allCategories.add(s.category)
  if (!systemsDraftItems.value.some(s => s.category === 'diger')) allCategories.delete('diger')
  form.value.covered_categories = [...allCategories]
  detectedNewCategories.value = [...allCategories].filter(c => !registeredCategories.has(c))
  newCategoryApprovals.value = Object.fromEntries(detectedNewCategories.value.map(c => [c, newCategoryApprovals.value[c] ?? true]))

  showCategoryOverrideModal.value = false
  const next = matchingStepOrder.value[matchingStepIndex.value + 1]
  if (next) matchingTab.value = next
}
const matchingBack = () => {
  const prev = matchingStepOrder.value[matchingStepIndex.value - 1]
  if (prev) { matchingTab.value = prev; return }
  wizardStage.value = selectedFixtureId.value ? 'fixture' : 'upload'
  selectedFile.value = null
}
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

// Onayla adımı da (Eşleştirme'deki gibi) tıklanabilir sekme DEĞİL,
// "İleri"/"Geri" ile ilerlenen sıralı bir alt-akış - Bulgular, Kontrol
// Maddeleri'nden HEMEN SONRA kendi adımında gelir, hepsi tek uzun sayfada
// üst üste değil.
type ConfirmTab = 'info' | 'controls' | 'systemControls' | 'findings' | 'equipment'
const confirmTab = ref<ConfirmTab>('info')
const confirmStepOrder: ConfirmTab[] = ['info', 'controls', 'systemControls', 'findings', 'equipment']
const confirmStepLabels: Record<ConfirmTab, string> = { info: 'Rapor Bilgileri', controls: 'Kontrol Maddeleri', systemControls: 'Sistem Maddeleri', findings: 'Bulgular', equipment: 'Ekipmanlar' }
const confirmStepIndex = computed(() => confirmStepOrder.indexOf(confirmTab.value))
const confirmNext = () => { const next = confirmStepOrder[confirmStepIndex.value + 1]; if (next) confirmTab.value = next }

const goToConfirm = () => {
  controlItemsForm.value = buildControlItemsFromDraft()
  equipmentPayload.value = buildEquipmentPayloadFromDraft()
  confirmTab.value = 'info'
  wizardStage.value = 'confirm'
}
const backToMatching = () => { wizardStage.value = 'matching'; matchingView.value = 'results' }
const confirmBack = () => {
  const prev = confirmStepOrder[confirmStepIndex.value - 1]
  if (prev) { confirmTab.value = prev; return }
  backToMatching()
}

// Eşleştirme adımında verilen kararlara göre bir equipmentIndex'in nihai
// envanter id'sini çözer (kesin eşleşme / tekil aday / kullanıcının
// belirsiz eşleşmede seçtiği aday). "Yeni" (sıfır aday) için null döner —
// kullanıcıdan onay beklenmez, backend rapor kaydedilirken equipment_code'u
// otomatik olarak yeni bir Sistem Bileşeni kaydına çevirir (bkz.
// FireSuppressionReportService::create()).
const resolvedInventoryItemIdFor = (equipmentIndex: number, item: NonNullable<FireSuppressionReportAnalysisDraft['equipment']>[number]): number | null => {
  const status = item.match?.status ?? 'new'
  if (status === 'exact') return item.match?.matched_id ?? null
  if (status === 'candidate_single') return item.match?.candidate_ids?.[0] ?? null
  if (status === 'candidate_multiple') {
    const resolution = ambiguousResolutions.value[equipmentIndex]
    return resolution?.action === 'match' ? (resolution.candidateId ?? null) : null
  }
  return null
}

// --- Kontrol Maddeleri — statik bir şablondan DEĞİL, AI'ın rapordan
// ekipman bazında çıkardığı gerçek maddelerden (equipment[].control_items)
// kurulur. Kullanıcı sadece gözden geçirir/düzeltir, elle baştan işaretlemez.
const buildControlItemsFromDraft = (): FireSuppressionReportControlItemInput[] => {
  const items: FireSuppressionReportControlItemInput[] = []

  equipmentDraftItems.value.forEach((item, equipmentIndex) => {
    if (!item.control_items?.length) return

    // "Yeni" (envanterde karşılığı olmayan) ekipman kullanıcı tarafından
    // onaylanmadıysa bu ekipmanın kontrol maddeleri backend'e HİÇ
    // gönderilmez — ne yeni bir Sistem Bileşeni açılır ne de rapora işlenir.
    // Rapor tek başına envanter için kaynak sayılamaz.
    const status = item.match?.status ?? 'new'
    if (status === 'new' && !isNewItemApproved(equipmentIndex)) return

    const inventoryItemId = resolvedInventoryItemIdFor(equipmentIndex, item)

    for (const ci of item.control_items) {
      items.push({
        category: item.category ?? null,
        equipment_code: item.code ?? null,
        inventory_item_id: inventoryItemId,
        code: ci.code ?? null,
        title: ci.title,
        status: ci.status,
        // Bulgu bölümünden (AI'sız, deterministik regex eşleştirmeyle)
        // otomatik dolduruldu — kullanıcı gerekirse düzenleyebilir.
        description: ci.description ?? '',
      })
    }
  })

  // Sistem seviyeli (equipment'a bağlı olmayan) maddeler - "Belge ve Kayıt
  // Kontrolleri" gibi hiç ekipmanı olmayan sistemlerin kendi maddeleri.
  // equipment_code=null gönderilir, backend bunu category'ye göre whole_unit
  // Sistem Bileşeni'yle eşleştirir/açar (control_items'teki equipment_code'lu
  // dal ile AYNI create() akışı, bkz. FireSuppressionReportService).
  systemsDraftItems.value.forEach((system) => {
    for (const ci of system.control_items ?? []) {
      if (ci.scope === 'equipment') continue
      if (ci.result_normalized === null || ci.result_normalized === undefined) continue
      items.push({
        category: system.category ?? null,
        equipment_code: null,
        inventory_item_id: null,
        code: ci.code ?? null,
        title: ci.criterion ?? ci.code ?? '',
        status: ci.result_normalized,
        description: '',
      })
    }
  })

  return items
}

// Raporun TÜM ekipmanları — buildControlItemsFromDraft'ın aksine
// item.control_items?.length'e göre SÜZMEZ: equipment-seviyeli kontrol
// maddesi hiç olmayan (örn. Pompa Dairesi'ndeki tek tek pompalar, sadece
// sistem-seviyeli maddeleri olan) ekipmanlar da buraya girer. Eskiden bir
// ekipman SADECE control_items'i varsa (matriste yer alıyorsa) envantere
// kaydediliyordu - bu, marka/model/seri no/özellikleri taşıyan tek yol
// olduğu için bu listedeki her kalem backend'de kaydedilir/güncellenir
// (bkz. FireSuppressionReportService::create() $equipmentInput bloğu).
const buildEquipmentPayloadFromDraft = (): FireSuppressionReportEquipmentInput[] =>
  equipmentDraftItems.value.map((item, equipmentIndex) => {
    const status = item.match?.status ?? 'new'
    const approved = status !== 'new' || isNewItemApproved(equipmentIndex)
    return {
      code: item.code ?? null,
      category: item.category ?? null,
      inventory_item_id: resolvedInventoryItemIdFor(equipmentIndex, item),
      brand: item.brand ?? null,
      model: item.model ?? null,
      serial_no: item.serial_no ?? null,
      location_note: item.location_note ?? null,
      properties: item.properties ?? {},
      approved,
    }
  }).filter(e => e.approved)

// Ekipman başına onlarca madde tek seferde açık listelenince (20 ekipman x
// ~14 madde) kullanıcıyı yoruyordu — ekipman bazında özet karta geçildi:
// uygun ekipmanlar varsayılan KAPALI (sadece "Uygun" rozeti), uygunsuz
// ekipmanlar varsayılan olarak SADECE uygunsuz maddelerini gösterir; "daha
// fazla göster" ile tüm maddeler (uygun olanlar dahil) görülebilir.
type ControlItemEquipmentGroup = {
  equipmentCode: string
  category: FireSuppressionCategory | null
  // Raporun kendi serbest özellikleri (Cihaz Tipi, Bulunduğu Yer gibi) -
  // YSC (tüp) raporlarında kategori kavramı anlamsız olduğu için ("Diğer"),
  // kart başlığında kategori yerine bunlar gösterilir (bkz. template).
  properties: Record<string, string>
  items: FireSuppressionReportControlItemInput[]
  udItems: FireSuppressionReportControlItemInput[]
  okCount: number
}
// equipment_code tek başına bu raporda benzersiz olmayabilir (bkz. Tüp No
// çakışması) - equipmentDraftItems zaten AYNI equipment_code'u paylaşan
// birden fazla öğe içerebilir, bu durumda İLK eşleşenin özelliklerini
// kullanmak (kart başlığı için) yeterli, tam kimlik çözümü zaten backend'de
// (kayıt sırasında) yapılıyor.
const propertiesForEquipmentCode = (code: string): Record<string, string> =>
  equipmentDraftItems.value.find(e => e.code === code)?.properties ?? {}
const controlItemsByEquipment = computed<ControlItemEquipmentGroup[]>(() => {
  const groups = new Map<string, ControlItemEquipmentGroup>()
  for (const item of controlItemsForm.value) {
    if (!item.equipment_code) continue // sistem seviyeli maddeler - bkz. controlItemsBySystem
    const code = item.equipment_code
    if (!groups.has(code)) groups.set(code, { equipmentCode: code, category: item.category ?? null, properties: propertiesForEquipmentCode(code), items: [], udItems: [], okCount: 0 })
    const group = groups.get(code)!
    group.items.push(item)
    if (item.status === 'uygun_degil') group.udItems.push(item)
    else group.okCount++
  }
  return Array.from(groups.values())
})
// Sistem seviyeli maddeler (equipment_code=null) - kategoriye göre gruplanır,
// ekipman kartlarıyla ayrı bir ekranda gösterilir (bkz. confirmTab 'systemControls').
type ControlItemSystemGroup = { category: FireSuppressionCategory | null; items: FireSuppressionReportControlItemInput[]; udItems: FireSuppressionReportControlItemInput[]; okCount: number }
const controlItemsBySystem = computed<ControlItemSystemGroup[]>(() => {
  const groups = new Map<string, ControlItemSystemGroup>()
  for (const item of controlItemsForm.value) {
    if (item.equipment_code) continue
    const key = item.category ?? '—'
    if (!groups.has(key)) groups.set(key, { category: item.category ?? null, items: [], udItems: [], okCount: 0 })
    const group = groups.get(key)!
    group.items.push(item)
    if (item.status === 'uygun_degil') group.udItems.push(item)
    else group.okCount++
  }
  return Array.from(groups.values())
})
const expandedEquipmentCodes = ref<Set<string>>(new Set())
const toggleEquipmentExpanded = (code: string) => {
  const next = new Set(expandedEquipmentCodes.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expandedEquipmentCodes.value = next
}
const expandedSystemCategories = ref<Set<string>>(new Set())
const toggleSystemCategoryExpanded = (category: string) => {
  const next = new Set(expandedSystemCategories.value)
  if (next.has(category)) next.delete(category)
  else next.add(category)
  expandedSystemCategories.value = next
}
const controlItemStatusOptions: FireSuppressionControlItemStatus[] = ['uygun', 'uygun_degil', 'uygulanamiyor']
// Bu ekipman koduna değinen bulgu (Uygunsuzluklar) sayısı - ekipman kartının
// başlığında küçük bir bilgi ikonu + tooltip olarak gösterilir, kullanıcı
// Bulgular sekmesine gitmeden bu ekipmanla ilgili bir bulgu olduğunu görsün.
const findingsCountForEquipment = (code: string): number =>
  form.value.findings.filter(f => f.equipment_codes?.includes(code)).length

// --- Kontrol Maddeleri özeti (tıpkı "Tamamlandı" adımındaki istatistik
// kartları gibi) — ekipman kartlarına hiç girmeden genel tabloyu görmek için.
const controlItemsOverallSummary = computed(() => ({
  totalNonconformities: controlItemsByEquipment.value.reduce((sum, g) => sum + g.udItems.length, 0),
  nonconformingEquipmentCount: controlItemsByEquipment.value.filter(g => g.udItems.length > 0).length,
}))
type ControlItemCategorySummary = { category: FireSuppressionCategory; total: number; uygunCount: number; uygunsuzCount: number }
const controlItemsCategorySummary = computed<ControlItemCategorySummary[]>(() => {
  const byCategory = new Map<FireSuppressionCategory, { total: number; uygunsuz: number }>()
  for (const group of controlItemsByEquipment.value) {
    if (!group.category) continue
    if (!byCategory.has(group.category)) byCategory.set(group.category, { total: 0, uygunsuz: 0 })
    const entry = byCategory.get(group.category)!
    entry.total++
    if (group.udItems.length > 0) entry.uygunsuz++
  }
  return Array.from(byCategory.entries()).map(([category, c]) => ({
    category,
    total: c.total,
    uygunsuzCount: c.uygunsuz,
    uygunCount: c.total - c.uygunsuz,
  }))
})

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
// "Bu Raporda Kontrol Edilen Ekipmanlar" ARTIK sadece şubede zaten kayıtlı
// envanteri (inventoryItems) değil, RAPORUN KENDİ tespit ettiği ekipmanları
// (matchRows) gösterir - yeni bir şube için (henüz hiç envanter yokken) bu
// liste hep boş kalıyordu, "Bu şubede envanter kaydı yok" yazıyordu, halbuki
// rapor onlarca ekipman içeriyordu. Zaten eşleşmiş kalemler işaretlenebilir
// (covered_inventory_item_ids); henüz id'si olmayan YENİ kalemler backend'de
// kaydedilirken otomatik oluşturulup rapora bağlanır (bkz.
// FireSuppressionReportService::create() - touchedInventoryItemIds), bu
// yüzden burada salt bilgilendirme amaçlı, işaretlemeye gerek yoktur.
const reportEquipmentChecklist = computed(() => matchRows.value.map((row) => {
  const item = equipmentDraftItems.value[row.equipmentIndex]
  const inventoryItemId = item ? resolvedInventoryItemIdFor(row.equipmentIndex, item) : null
  return {
    equipmentIndex: row.equipmentIndex,
    code: row.code,
    categoryLabel: row.categoryLabel || 'Diğer',
    inventoryItemId,
  }
}))
const toggleFindingItem = (finding: FindingForm, id: number) => {
  finding.affected_item_ids ??= []
  const idx = finding.affected_item_ids.indexOf(id)
  if (idx === -1) finding.affected_item_ids.push(id)
  else finding.affected_item_ids.splice(idx, 1)
}
// "Ekipman Seç" listesi ARTIK sadece zaten envanterde kayıtlı ekipmanları
// değil, RAPORUN KENDİ ekipmanlarını gösterir (kayıtlı olsun olmasın) -
// backend kod+kategori ile eşleştirir, yoksa yeni bir Sistem Bileşeni
// olarak açar (bkz. FireSuppressionReportService::resolveFindingScope).
// Eskiden burada sadece inventoryItems (mevcut envanter) listeleniyordu,
// bu yüzden henüz kayıtlı olmayan bir ekipmana değinen bulgu için liste
// boş kalıyordu.
const reportEquipmentForCategory = (category?: FireSuppressionCategory | null) => {
  const seen = new Set<string>()
  return equipmentDraftItems.value
    .filter(e => e.code && (!category || e.category === category))
    .filter((e) => { const code = e.code as string; if (seen.has(code)) return false; seen.add(code); return true })
    .map(e => ({ code: e.code as string, matched: (e.match?.status ?? 'new') !== 'new' }))
}
const toggleFindingEquipmentCode = (finding: FindingForm, code: string) => {
  finding.equipment_codes ??= []
  const idx = finding.equipment_codes.indexOf(code)
  if (idx === -1) finding.equipment_codes.push(code)
  else finding.equipment_codes.splice(idx, 1)
}

const scopeOptions: { value: FireSuppressionFindingScope; label: string }[] = [
  { value: 'all', label: 'Tüm Ekipmanlara Uygula' },
  { value: 'specific', label: 'Ekipman Seç' },
  { value: 'area', label: 'Alan Belirt' },
  { value: 'unknown', label: 'Belirsiz Olarak Kaydet' },
]

// --- Adım 4: Onayla → kaydet ---
// AI'ın belirlediği rapor tipi "ysc" ise (taşınabilir yangın söndürücü/tüp
// raporu), aynı ekran/akıştan devam edilir ama kayıt FireSuppressionReport
// yerine YSC alan modeline (LocationEmergencyEquipment + EmergencyEquipment
// AnnualControlReport) gider - bkz. YscAnnualControlSaveService.
const submitYsc = async () => {
  // THROW (not toast+return) - submit()'in try/catch'i bunu gerçek bir
  // hata olarak görmeli. Önceden sessizce dönüyordu, submit() bunu
  // exception saymayıp "YSC raporu kaydedildi" diye SAHTE başarı
  // gösteriyordu - hiçbir şey kaydedilmediği halde.
  if (!context.branchId) throw new Error('Şube seçili değil.')
  // Test modu: gerçek dosya yoksa (fixture akışı), fixtureId gönderilir -
  // aynı StoreFireSuppressionReportRequest'teki konvansiyon.
  if (!selectedFile.value && !selectedFixtureId.value) {
    throw new Error('YSC raporu için gerçek PDF dosyası veya fixture gereklidir.')
  }
  const controlItems = systemsDraftItems.value.flatMap(s => s.control_items ?? [])
  const { data: report } = await emergencyEquipmentAnnualControlApi.createFromAnalysis(context.branchId, {
    control_date: form.value.report_date,
    next_control_date: form.value.next_control_date || null,
    result: (form.value.overall_result as 'uygun' | 'uygun_degil' | null) || null,
    company_name: form.value.inspection_company_name || null,
    notes: form.value.notes || null,
    file: selectedFile.value,
    fixtureId: selectedFile.value ? null : selectedFixtureId.value,
    equipment: equipmentDraftItems.value,
    control_items: controlItems,
  })
  savedReport.value = report
}

const submit = async () => {
  // Normal akışta gerçek dosya (selectedFile) şart; fixture akışında hiç
  // dosya seçilmediği için onun yerine fixtureId gönderilir (bkz.
  // fireSuppressionReportApi.create / backend uploadedFileFromFixture).
  if (!context.branchId || saving.value || (!selectedFile.value && !selectedFixtureId.value)) return
  saving.value = true
  try {
    if (reportCategory.value === 'ysc') {
      await submitYsc()
      $toast.success('YSC yıllık kontrol raporu kaydedildi.')
      wizardStage.value = 'done'
      return
    }

    const { data: report } = await fireSuppressionReportApi.create(context.branchId, {
      report_date: form.value.report_date,
      report_no: form.value.report_no || null,
      next_control_date: form.value.next_control_date || null,
      covered_categories: form.value.covered_categories,
      overall_result: form.value.overall_result || null,
      inspection_company_name: form.value.inspection_company_name || null,
      notes: form.value.notes || null,
      file: selectedFile.value,
      fixtureId: selectedFile.value ? null : selectedFixtureId.value,
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
          equipment_codes: f.scope === 'specific' ? f.equipment_codes : [],
        })),
      control_items: controlItemsForm.value,
      equipment: equipmentPayload.value,
      additional_files: additionalFiles.value,
      approved_new_categories: detectedNewCategories.value.filter(c => isNewCategoryApproved(c)),
    })
    $toast.success('Rapor yüklendi.')
    savedReport.value = report
    wizardStage.value = 'done'
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Rapor yüklenemedi.')
  } finally {
    saving.value = false
  }
}

const doneStats = computed(() => {
  const yeniRows = matchRows.value.filter(r => r.bucket === 'yeni')
  const yeniOnaysizAmbiguous = Object.values(ambiguousResolutions.value).filter(r => r.action === 'none').length
  const yeniEklenen = yeniRows.filter(r => isNewItemApproved(r.equipmentIndex)).length + yeniOnaysizAmbiguous
  const yeniHaricTutulan = yeniRows.filter(r => !isNewItemApproved(r.equipmentIndex)).length

  return {
    total: matchRows.value.length,
    kesin: matchRows.value.filter(r => r.bucket === 'kesin').length,
    belirsizBirakilan: Object.values(ambiguousResolutions.value).filter(r => r.action === 'ambiguous').length
      + ambiguousMatches.value.filter(e => !ambiguousResolutions.value[e.equipmentIndex]).length,
    yeni: yeniEklenen,
    yeniHaricTutulan,
  }
})

const newCategoriesAdded = computed(() => detectedNewCategories.value.filter(c => isNewCategoryApproved(c)))
const newCategoriesExcluded = computed(() => detectedNewCategories.value.filter(c => !isNewCategoryApproved(c)))
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen w-full transition-[padding] duration-300', isExpanded ? 'lg:pl-[240px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-3xl">
          <button type="button" class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#64748b] hover:text-[#111827] dark:hover:text-white" @click="goToReportsList">
            <ArrowLeft :size="16" />
            Raporlara Dön
          </button>

          <div class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
            <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <p class="text-sm font-bold text-[#172033] dark:text-white">Yıllık Periyodik Kontrol Raporu Yükle</p>
            </div>

            <IsgReportUploadStepper :steps="wizardStepLabels" :current-step="currentStepNumber" />

            <div class="px-5 py-5">
              <!-- Adım 1: Dosya Yükle -->
              <template v-if="wizardStage === 'upload'">
                <IsgReportFileDropzone
                  hint="Sadece yıllık periyodik kontrol raporları yüklenebilir. Dosya seçildiğinde analiz otomatik başlar."
                  @select="selectFile"
                />
                <button
                  type="button"
                  class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-violet-300 bg-violet-50/60 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
                  @click="goToFixtureStep"
                >
                  <FlaskConical :size="14" />
                  Test Modu: Kayıtlı Gemini Fixture'ı ile Devam Et (dosya yüklemeden)
                </button>
              </template>

              <!-- Adım 1.5 (GEÇİCİ, test modu): Fixture Seç -->
              <div v-else-if="wizardStage === 'fixture'">
                <div class="mb-4 flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50/60 px-3.5 py-3 dark:border-violet-500/20 dark:bg-violet-500/5">
                  <FlaskConical :size="15" class="mt-0.5 shrink-0 text-violet-600" />
                  <p class="text-[11px] leading-relaxed text-violet-700 dark:text-violet-300">
                    Test modu: Gemini'ye tekrar istek atılmaz, daha önce kaydedilmiş bir fixture'ın çıktısı kullanılır. PDF de fixture ile birlikte zaten kayıtlıdır.
                  </p>
                </div>

                <div v-if="fixturesLoading" class="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
                  <LoaderCircle :size="16" class="animate-spin" />Fixturelar yükleniyor...
                </div>
                <div v-else-if="!fixtures.length" class="rounded-lg border border-dashed border-[#dfe3e8] p-4 text-center text-xs text-gray-400 dark:border-gray-700">
                  Kayıtlı Gemini fixture'ı bulunamadı.
                </div>
                <div v-else class="max-h-[420px] space-y-1.5 overflow-y-auto">
                  <label
                    v-for="item in fixtures"
                    :key="item.fixture_id"
                    class="flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-xs"
                    :class="selectedFixtureId === item.fixture_id ? 'border-[#d71920] bg-red-50 dark:bg-red-500/10' : 'border-[#e7e9ed] hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5'"
                  >
                    <input v-model="selectedFixtureId" type="radio" :value="item.fixture_id" class="hidden">
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-semibold text-[#172033] dark:text-white">{{ item.original_file_name }}</p>
                      <p class="mt-0.5 text-[10px] text-gray-400">{{ item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : item.fixture_id }}</p>
                    </div>
                    <span v-if="item.pdf_available === false" class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/10">PDF yok</span>
                  </label>
                </div>
              </div>

              <!-- Adım 2: AI Analizi -->
              <IsgReportAnalyzingProgress
                v-else-if="wizardStage === 'analyzing'"
                :file="selectedFile"
                @cancel="cancelAnalyzing"
                @completed="onAnalysisCompleted"
                @failed="onAnalysisFailed"
              />

              <!-- Adım 3: Eşleştirme -->
              <template v-else-if="wizardStage === 'matching'">
                <!-- Geçici AI JSON görüntüleme — sadece analiz sonucunu incelemek için. -->
                <div v-if="matchingView === 'results'" class="mb-4 overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between px-4 py-3 text-left"
                    @click="showAiRawResult = !showAiRawResult"
                  >
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wide text-gray-400">AI Analiz JSON</p>
                      <p class="mt-0.5 text-[11px] text-gray-400">Frontend'e ulaşan normalize edilmiş analiz sonucu</p>
                    </div>
                    <span class="text-xs font-semibold text-[#d71920]">
                      {{ showAiRawResult ? 'Gizle' : 'JSON’u Göster' }}
                    </span>
                  </button>

                  <pre
                    v-if="showAiRawResult"
                    class="max-h-[600px] overflow-auto border-t border-[#e7e9ed] bg-gray-50 p-4 text-[11px] leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
                  >{{ JSON.stringify(aiRawResult, null, 2) }}</pre>
                </div>

                <!-- Yeni Sistemler / Sistemler / Bileşenler — tıklanabilir sekme
                     DEĞİL, "İleri"/"Geri" ile ilerlenen sıralı bir alt-akış
                     (sadece nerede olduğunu gösteren, tıklanamayan bir gösterge). -->
                <div v-if="matchingView === 'results'" class="mb-4 flex items-center gap-2">
                  <div
                    v-for="(step, index) in matchingStepOrder"
                    :key="step"
                    class="flex items-center gap-2"
                    :class="index > 0 ? 'flex-1' : ''"
                  >
                    <span v-if="index > 0" class="h-px flex-1" :class="matchingStepOrder.indexOf(matchingTab) >= index ? 'bg-[#d71920]' : 'bg-[#e7e9ed] dark:bg-gray-800'" />
                    <span class="flex items-center gap-1.5 text-xs font-semibold" :class="matchingTab === step ? 'text-[#d71920]' : matchingStepOrder.indexOf(matchingTab) > index ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'">
                      {{ matchingStepLabels[step] }}
                      <span v-if="step === 'new_systems' && detectedNewCategories.length" class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{{ detectedNewCategories.length }}</span>
                      <span v-if="step === 'components' && matchRows.length" class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ matchRows.length }}</span>
                    </span>
                  </div>
                </div>

                <!-- Sekme: Yeni Sistemler — raporun kapsadığı ama bu şubenin
                     envanterinde HENÜZ kayıtlı olmayan ana sistemler/kategoriler,
                     tek tek ekipmanlardan (Bileşenler sekmesi) AYRI, çünkü Su
                     Deposu/Sabit Boru gibi sistemler bir ekipman tablosu olarak
                     hiç geçmeyebilir. -->
                <div v-if="matchingView === 'results' && matchingTab === 'new_systems'">
                  <div v-if="detectedNewCategories.length" class="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                    <p class="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Raporda Tespit Edilen Yeni Sistemler</p>
                    <p class="mb-3 text-[11px] text-amber-700/80 dark:text-amber-400/70">Bu rapor aşağıdaki sistemleri kapsıyor ama bu şubenin tesisat envanterinde henüz kayıtlı değiller. Tesisat Durumu ekranında görünmeleri için envanterinize eklensin mi?</p>
                    <div class="space-y-1.5">
                      <label v-for="c in detectedNewCategories" :key="c" class="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-amber-200/70 bg-white px-3 py-2 text-xs dark:border-amber-500/20 dark:bg-gray-900">
                        <span class="min-w-0">
                          <!-- "Diğer" (ya da label haritasında hiç karşılığı olmayan,
                               beklenmedik bir kategori) hangi rapor sistemi olduğunu
                               göstermez - HİÇBİR ZAMAN boş/tahmini bırakılmaz, ham
                               sistem adı(ları) + "kategori eşleştirme gerekli" gösterilir. -->
                          <template v-if="categoryNeedsResolution(c) && unresolvedCategorySystemNames.length">
                            <span class="font-semibold text-[#172033] dark:text-white">{{ unresolvedCategorySystemNames.join(', ') }}</span>
                            <span class="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Kategori eşleştirme gerekli</span>
                          </template>
                          <span v-else class="font-semibold text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</span>
                        </span>
                        <span class="inline-flex shrink-0 cursor-pointer select-none items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <input
                            type="checkbox"
                            class="h-3.5 w-3.5 rounded border-gray-300 text-[#d71920] focus:ring-[#d71920]"
                            :checked="isNewCategoryApproved(c)"
                            @change="toggleNewCategoryApproval(c)"
                          >
                          Envantere ekle
                        </span>
                      </label>
                    </div>
                  </div>
                  <div v-else class="rounded-lg border border-dashed border-[#dfe3e8] p-4 text-center text-xs text-gray-400 dark:border-gray-700">Rapor, bu şubenin envanterinde henüz kayıtlı olmayan yeni bir sistem içermiyor.</div>
                </div>

                <!-- Sekme: Sistemler + Bileşenler (IsgMatchResultsTable, section prop ile tek tek gösterir) -->
                <IsgMatchResultsTable
                  v-if="matchingView === 'results' && (matchingTab === 'systems' || matchingTab === 'components')"
                  :section="matchingTab"
                  :rows="matchRows"
                  :report-category="reportCategory"
                  :resolution-label="resolutionLabel"
                  :new-item-approved="isNewItemApproved"
                  @inspect="openDetail"
                  @toggle-new="toggleNewItemApproval"
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
                <!-- Rapor Bilgileri / Kontrol Maddeleri / Bulgular / Ekipmanlar —
                     tıklanamayan, sadece nerede olduğunu gösteren adım göstergesi. -->
                <div class="mb-5 flex items-center gap-2">
                  <div v-for="(step, index) in confirmStepOrder" :key="step" class="flex items-center gap-2" :class="index > 0 ? 'flex-1' : ''">
                    <span v-if="index > 0" class="h-px flex-1" :class="confirmStepIndex >= index ? 'bg-[#d71920]' : 'bg-[#e7e9ed] dark:bg-gray-800'" />
                    <span class="text-xs font-semibold" :class="confirmTab === step ? 'text-[#d71920]' : confirmStepIndex > index ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'">{{ confirmStepLabels[step] }}</span>
                  </div>
                </div>

                <div v-if="confirmTab === 'info'" class="space-y-6">
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
                    <!-- YSC (tüp) raporlarında dolap/hidrant/pompa gibi
                         tesisat kategorileri kavramı yok - bu seçim listesi
                         anlamsız, gösterilmez. -->
                    <div v-if="reportCategory !== 'ysc'" class="mt-3">
                      <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kontrol Edilen Sistemler</label>
                      <div class="flex flex-wrap gap-2">
                        <label v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium" :class="form.covered_categories.includes(c) ? 'border-[#d71920] bg-red-50 text-[#d71920] dark:bg-red-500/10' : 'border-[#dfe3e8] text-gray-600 dark:border-gray-700 dark:text-gray-300'">
                          <input v-model="form.covered_categories" type="checkbox" :value="c" class="hidden">
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

                <div v-else-if="confirmTab === 'controls'">
                  <p class="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Kontrol Maddeleri</p>
                    <p class="mb-3 text-[11px] text-gray-400">Raporun kendisinden, ekipman bazında otomatik çıkarılmıştır — açıklamalar bulgu metninden alınmıştır. Uygun ekipmanlar özet gösterilir.</p>
                    <div v-if="!controlItemsForm.length" class="rounded-lg border border-dashed border-[#dfe3e8] p-4 text-center text-xs text-gray-400 dark:border-gray-700">Raporda ekipman bazlı kontrol maddesi tespit edilemedi.</div>
                    <template v-else>
                      <div class="mb-3 grid grid-cols-2 gap-3">
                        <div class="rounded-lg bg-red-50 p-3 text-center dark:bg-red-500/10">
                          <p class="text-xl font-bold text-[#d71920]">{{ controlItemsOverallSummary.totalNonconformities }}</p>
                          <p class="text-[11px] text-[#d71920]">Toplam Uygunsuzluk</p>
                        </div>
                        <div class="rounded-lg bg-red-50 p-3 text-center dark:bg-red-500/10">
                          <p class="text-xl font-bold text-[#d71920]">{{ controlItemsOverallSummary.nonconformingEquipmentCount }}</p>
                          <p class="text-[11px] text-[#d71920]">Uygunsuz Ekipman</p>
                        </div>
                      </div>
                      <div class="mb-3 overflow-hidden rounded-lg border border-[#e7e9ed] dark:border-gray-800">
                        <div v-for="cs in controlItemsCategorySummary" :key="cs.category" class="flex items-center justify-between gap-2 border-b border-[#f1f2f4] px-3 py-2 text-xs last:border-0 dark:border-gray-800">
                          <span class="font-semibold text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[cs.category] }}</span>
                          <span class="flex items-center gap-2 text-[11px]">
                            <span class="text-gray-400">{{ cs.total }} ekipman</span>
                            <span class="font-semibold text-emerald-600">{{ cs.uygunCount }} uygun</span>
                            <span class="font-semibold text-[#d71920]">{{ cs.uygunsuzCount }} uygunsuz</span>
                          </span>
                        </div>
                      </div>
                    </template>
                    <div v-if="controlItemsForm.length" class="space-y-2">
                      <div v-for="group in controlItemsByEquipment" :key="group.equipmentCode" class="overflow-hidden rounded-lg border border-[#e7e9ed] dark:border-gray-800">
                        <button type="button" class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5" @click="toggleEquipmentExpanded(group.equipmentCode)">
                          <div class="flex items-center gap-2">
                            <template v-if="reportCategory === 'ysc'">
                              <span class="text-xs font-bold text-[#172033] dark:text-white">Tüp No: {{ group.equipmentCode }}</span>
                              <span v-if="Object.keys(group.properties).length" class="text-[11px] text-gray-400">{{ Object.entries(group.properties).map(([k, v]) => `${k}: ${v}`).join(' · ') }}</span>
                            </template>
                            <template v-else>
                              <span class="text-xs font-bold text-[#172033] dark:text-white">{{ group.equipmentCode }}</span>
                              <span v-if="group.category" class="text-[11px] text-gray-400">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[group.category] }}</span>
                            </template>
                            <Info
                              v-if="findingsCountForEquipment(group.equipmentCode)"
                              :size="13"
                              class="shrink-0 text-blue-500"
                              :title="`Bu ekipmanla ilgili ${findingsCountForEquipment(group.equipmentCode)} bulgu var`"
                            />
                          </div>
                          <div class="flex items-center gap-2">
                            <span v-if="group.udItems.length" class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-[#d71920] dark:bg-red-500/10">Uygun Değil · {{ group.udItems.length }}</span>
                            <span v-else class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10">Uygun</span>
                            <ChevronRight :size="14" class="shrink-0 text-gray-400 transition-transform" :class="expandedEquipmentCodes.has(group.equipmentCode) ? 'rotate-90' : ''" />
                          </div>
                        </button>
                        <div v-if="expandedEquipmentCodes.has(group.equipmentCode)" class="space-y-2 border-t border-[#f1f2f4] p-3 dark:border-gray-800">
                          <div v-for="(ci, ciIndex) in group.items" :key="`${group.equipmentCode}-${ci.code}-${ciIndex}`" class="rounded-lg border border-[#f1f2f4] p-2.5 dark:border-gray-800">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                              <p class="text-xs font-medium text-gray-700 dark:text-gray-200">
                                <span v-if="ci.code" class="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ ci.code }}</span>
                                {{ ci.title }}
                              </p>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="confirmTab === 'systemControls'">
                    <p class="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Sistem Maddeleri</p>
                    <p class="mb-3 text-[11px] text-gray-400">Belirli bir ekipmana değil, tüm sisteme ait kontrol maddeleri (örn. proje/belge kontrolleri).</p>
                    <div v-if="!controlItemsBySystem.length" class="rounded-lg border border-dashed border-[#dfe3e8] p-4 text-center text-xs text-gray-400 dark:border-gray-700">Sistem seviyeli kontrol maddesi tespit edilemedi.</div>
                    <div v-else class="space-y-2">
                      <div v-for="group in controlItemsBySystem" :key="group.category ?? '—'" class="overflow-hidden rounded-lg border border-[#e7e9ed] dark:border-gray-800">
                        <button type="button" class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5" @click="toggleSystemCategoryExpanded(group.category ?? '—')">
                          <!-- YSC (tüp) raporlarında kategori kavramı yok -
                               sistem maddeleri hep 'diger'e düşer, bu da
                               anlamsız bir "Diğer" rozetine yol açardı. -->
                          <span class="text-xs font-bold text-[#172033] dark:text-white">{{ reportCategory === 'ysc' ? 'Genel Kriterler' : (group.category ? FIRE_SUPPRESSION_CATEGORY_LABELS[group.category] : 'Diğer') }}</span>
                          <div class="flex items-center gap-2">
                            <span v-if="group.udItems.length" class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-[#d71920] dark:bg-red-500/10">Uygun Değil · {{ group.udItems.length }}</span>
                            <span v-else class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10">Uygun</span>
                            <ChevronRight :size="14" class="shrink-0 text-gray-400 transition-transform" :class="expandedSystemCategories.has(group.category ?? '—') ? 'rotate-90' : ''" />
                          </div>
                        </button>
                        <div v-if="expandedSystemCategories.has(group.category ?? '—')" class="space-y-2 border-t border-[#f1f2f4] p-3 dark:border-gray-800">
                          <div v-for="(ci, ciIndex) in group.items" :key="`${group.category}-${ci.code}-${ciIndex}`" class="rounded-lg border border-[#f1f2f4] p-2.5 dark:border-gray-800">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                              <p class="text-xs font-medium text-gray-700 dark:text-gray-200">
                                <span v-if="ci.code" class="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ ci.code }}</span>
                                {{ ci.title }}
                              </p>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="confirmTab === 'findings'">
                    <!-- Raporun kendi resmi "SONUÇ VE KANAAT" metni - bulgu
                         (Uygunsuzluk) olsun olmasın HER raporda vardır, bu
                         yüzden aşağıdaki listeden bağımsız her zaman gösterilir. -->
                    <div v-if="aiOverallResultText" class="mb-4 rounded-lg border border-[#e7e9ed] bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-white/[0.03]">
                      <p class="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Raporun Sonuç ve Kanaati</p>
                      <p class="text-xs leading-relaxed text-gray-600 dark:text-gray-300">{{ aiOverallResultText }}</p>
                    </div>
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
                        <input v-model="finding.area_note" type="text" placeholder="Alan (örn. 1. Kat)" class="h-9 w-full rounded-lg border border-[#dfe3e8] px-2 text-xs outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
                      </div>
                      <div v-if="finding.scope === 'specific'" class="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[#f1f2f4] p-2 dark:border-gray-800">
                        <label v-for="item in reportEquipmentForCategory(finding.category)" :key="item.code" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <input type="checkbox" :checked="finding.equipment_codes?.includes(item.code)" @change="toggleFindingEquipmentCode(finding, item.code)">
                          {{ item.code }}
                          <span v-if="!item.matched" class="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-500/10">Yeni</span>
                        </label>
                        <p v-if="!reportEquipmentForCategory(finding.category).length" class="text-[11px] text-gray-400">Bu raporda bu kategoride ekipman tespit edilmedi.</p>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="confirmTab === 'equipment'">
                    <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Bu Raporda Kontrol Edilen Ekipmanlar</p>
                    <div class="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-[#e7e9ed] p-3 dark:border-gray-800">
                      <label v-for="item in reportEquipmentChecklist" :key="item.equipmentIndex" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          :checked="item.inventoryItemId ? form.covered_inventory_item_ids.includes(item.inventoryItemId) : true"
                          :disabled="!item.inventoryItemId"
                          @change="item.inventoryItemId && toggleCoveredItem(item.inventoryItemId)"
                        >
                        {{ item.code || item.categoryLabel }} <span class="text-gray-400">({{ item.categoryLabel }})</span>
                        <span v-if="!item.inventoryItemId" class="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-500/10">Yeni — otomatik eklenecek</span>
                      </label>
                      <p v-if="!reportEquipmentChecklist.length" class="text-[11px] text-gray-400">Bu raporda ekipman bazlı bir kalem tespit edilemedi.</p>
                    </div>
                    <p class="mt-1.5 text-[11px] text-gray-400">AI eşleştirmesi + belirsiz eşleşme kararlarınız burada otomatik işaretlenmiştir; "Yeni" işaretli olanlar kaydedince otomatik envantere eklenip bu rapora bağlanır, elle işaretlemenize gerek yoktur.</p>
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
                    <p class="text-xs text-gray-400">Envantere Eklenen (Yeni)</p>
                  </div>
                </div>
                <p v-if="doneStats.yeniHaricTutulan" class="mt-3 text-xs text-gray-400">
                  {{ doneStats.yeniHaricTutulan }} yeni ekipman onaylanmadığı için envantere eklenmedi, rapora da işlenmedi.
                </p>
                <p v-if="newCategoriesAdded.length" class="mt-1 text-xs text-gray-400">
                  Yeni sistemler envanterinize eklendi: {{ newCategoriesAdded.map(c => FIRE_SUPPRESSION_CATEGORY_LABELS[c]).join(', ') }}.
                </p>
                <p v-if="newCategoriesExcluded.length" class="mt-1 text-xs text-gray-400">
                  {{ newCategoriesExcluded.map(c => FIRE_SUPPRESSION_CATEGORY_LABELS[c]).join(', ') }} onaylanmadığı için envantere eklenmedi.
                </p>
              </div>
            </div>

            <div class="sticky bottom-0 z-10 flex gap-2 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <template v-if="wizardStage === 'upload'">
                <button type="button" class="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="goToReportsList">Vazgeç</button>
              </template>
              <template v-else-if="wizardStage === 'fixture'">
                <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="wizardStage = 'upload'; selectedFixtureId = ''">Geri</button>
                <button type="button" class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="!selectedFixtureId" @click="runAnalyzingFromFixture">
                  <FlaskConical :size="15" />Fixture ile Devam Et
                </button>
              </template>
              <template v-else-if="wizardStage === 'matching' && matchingView === 'results'">
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  @click="matchingBack"
                >Geri</button>
                <button
                  v-if="matchingStepIndex < matchingStepOrder.length - 1"
                  type="button"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white"
                  @click="matchingNext"
                >İleri<ChevronRight :size="15" /></button>
                <button
                  v-else
                  type="button"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white"
                  @click="goToConfirm"
                >Onaya Geç<ChevronRight :size="15" /></button>
              </template>
              <template v-else-if="wizardStage === 'confirm'">
                <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="saving" @click="confirmBack">Geri</button>
                <button
                  v-if="confirmStepIndex < confirmStepOrder.length - 1"
                  type="button"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white"
                  @click="confirmNext"
                >İleri<ChevronRight :size="15" /></button>
                <button v-else type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="saving || !form.report_date" @click="submit">
                  <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
                  Raporu Kaydet
                </button>
              </template>
              <template v-else-if="wizardStage === 'done'">
                <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="goToReportsList">Raporlar Sayfasına Dön</button>
                <button type="button" class="flex-1 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white" @click="resetWizard">Başka Rapor Yükle</button>
              </template>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal: "diger" (Diğer) genel kovasına düşmüş sistemler için kategori
         seçtirme - "Yeni Sistemler" adımından İleri'ye basınca, çözülmemiş
         böyle bir sistem varsa açılır (bkz. matchingNext). -->
    <div v-if="showCategoryOverrideModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <h3 class="text-base font-bold text-[#172033] dark:text-white">Olmayan Sistemler İçin Kategori Giriniz</h3>
        <p class="mt-1 text-xs text-gray-400">Bu sistemler bilinen bir kategoriyle otomatik eşleştirilemedi. Devam etmeden önce her biri için gerçek kategoriyi seç.</p>
        <div class="mt-4 space-y-3">
          <div v-for="name in unresolvedCategorySystemNames" :key="name">
            <label class="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{{ name }}</label>
            <select v-model="categoryOverrideDrafts[name]" class="h-10 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option value="">Kategori seç</option>
              <option v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" :value="c">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</option>
            </select>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="showCategoryOverrideModal = false">Vazgeç</button>
          <button
            type="button"
            class="rounded-lg bg-[#d71920] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            :disabled="unresolvedCategorySystemNames.some(n => !categoryOverrideDrafts[n])"
            @click="applyCategoryOverridesAndContinue"
          >Kaydet ve Devam Et</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
