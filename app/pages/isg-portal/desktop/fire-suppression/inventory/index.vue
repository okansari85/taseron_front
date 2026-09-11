<script setup lang="ts">
import {
  Box,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Container,
  Cylinder,
  Droplets,
  FileText,
  FireExtinguisher,
  Gauge,
  History,
  Info,
  Layers,
  ClipboardList,
  MinusCircle,
  Plus,
  Trash2,
  Waves,
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
import type { FireSuppressionReport, FireSuppressionReportControlItem } from '~/types/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'
import { useFireSuppressionCategorySettings } from '~/composables/useFireSuppressionCategorySettings'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()
const categorySettings = useFireSuppressionCategorySettings()

// Rapor ve kalıcı Sistem Bileşenleri kaydı BİRBİRİNDEN BAĞIMSIZ — bu sayfa
// artık "rapor var mı" sorusuna değil "tesisat hakkında HERHANGİ bir bilgi
// var mı" sorusuna göre içerik gösteriyor. Lokasyonun bileşenleri olabilir
// ama hiç raporu olmayabilir (yeni kaydedilmiş bir tesisat), ya da tam
// tersi — ikisi de sayfanın KENDİ düzeni içinde (boş, ayrı bir kutu değil)
// gösterilmeli.
const report = ref<FireSuppressionReport | null>(null)
const components = ref<FireSuppressionInventoryItem[]>([])
const loading = ref(true)

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
    const { data: detail } = await fireSuppressionReportApi.get(latest.id)
    report.value = detail
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

// Kategoriler sabit bir liste değil — raporun kendi control_items verisinde
// hangi sistemler geçtiyse sadece onlar gösterilir. Bilinen 7 kod için
// Türkçe etiket/ikon kullanılır, başka bir bölüm adı gelirse ham değer
// gösterilir.
const CATEGORY_ICONS: Partial<Record<string, typeof Droplets>> = {
  sprinkler: Droplets,
  yangin_dolabi: FireExtinguisher,
  hidrant: Waves,
  yangin_pompasi: Gauge,
  su_deposu: Cylinder,
  sabit_boru: Waves,
  gazli_sondurme: Container,
  diger: FileText,
}

const categoryLabel = (category: string): string => categorySettings.label(category) || FIRE_SUPPRESSION_CATEGORY_LABELS[category as FireSuppressionCategory] || category
const categoryIcon = (category: string) => CATEGORY_ICONS[category] ?? FileText

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

// --- Sistem bazlı özet ---
// ÖNEMLİ: "kontrol maddesi" ve "uygunsuzluk", raporun ham control_item
// SATIRLARI değil, o kategorideki BENZERSİZ madde KODLARI üzerinden
// hesaplanır (örn. Yangın Dolabı'nda aynı 16 madde 147 dolabın her biri için
// tekrarlanır — satır sayısı ~2350'dir ama "kontrol maddesi" 16'dır). Bir
// madde, kategoride EN AZ BİR ekipman için "uygun_degil" ise o madde
// "uygunsuzluk maddesi" sayılır. Birim (ekipman) sayısı ve "kaçı uygunsuz"
// bunun tamamen AYRI, kendi ekseni: equipment_code bazında benzersiz sayım.
type SystemSummary = {
  category: string
  items: FireSuppressionReportControlItem[]
  registeredCount: number
  unitCount: number
  unitsNonconform: number
  controlItemCount: number
  nonconformCount: number
  // null = bu sistem için henüz hiç rapor verisi yok (sadece kayıtlı
  // bileşen var) — "Uygun/Uygun Değil" değil, nötr "Rapor Yok" gösterilir.
  status: 'uygun' | 'uygun_degil' | null
  pumpBreakdown: { main: number; jokey: number } | null
}

// Sistem listesi SADECE kalıcı kayıtlı bileşenlerden (müşterinin kendi
// eklediği veya önceden ONAYLADIĞI bileşenlerden) çıkar — rapor bunun için
// asla tek başına kaynak olamaz ("raporda geçiyor" ≠ "tesisatta var").
// Bir kategori bileşen kaydına sahipse (hiç rapor yoksa bile) satır YİNE DE
// gösterilir — sadece kontrol/uygunsuzluk sütunları boş, durum nötr kalır.
// Bir kategoride HİÇ kayıtlı bileşen yoksa (kullanıcı hiç eklemediyse) o
// kategori burada HİÇ gösterilmez — "belki bende hidrant yok" durumu budur.
const systemSummaries = computed<SystemSummary[]>(() => {
  const byCategory = new Map<string, FireSuppressionReportControlItem[]>()
  for (const ci of report.value?.control_items ?? []) {
    const key = ci.category ?? 'diger'
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key)!.push(ci)
  }

  // Bazı ana bileşenler (Yangın Pompa Dairesi gibi) TEK bir kapsayıcı kayıt
  // (code=null, unit_scope=whole_unit) + onun ALTINDA ayrı kayıtlı ekipman
  // (Pompa 1, Pompa 2, Jokey) şeklinde tutuluyor (bkz. proje mimari kararı:
  // "pompa ayrı bir ana sistem bileşeni değildir"). Kapsayıcı satırın
  // kendisi bir "adet" değildir — sadece ALT kayıtlar (code dolu olanlar)
  // sayılır. Dolap/hidrant gibi per-unit bileşenlerde zaten hiç kapsayıcı
  // yok, her satırın kendisi zaten bir alt-kayıt gibi (code dolu) davranır.
  //
  // AMA Su Deposu gibi TAMAMEN whole_unit kategorilerde hiç "alt kayıt" YOK
  // — tek kaydın kendisi zaten kapsayıcı ve code=null'dur (bkz. FireSuppressionInventoryItem
  // model notu: "içindeki alt-birimler ayrı ayrı sayılmaz, tek bir checklist
  // ile değerlendirilir"). Bu yüzden "kategori KAYITLI mı" sorusu code'lu
  // satırlarla SINIRLANAMAZ — code'suz (kapsayıcı) bir satır bile o
  // kategorinin GERÇEKTEN eklendiğini/onaylandığını gösterir; sadece SAYIM
  // (registeredCount, "N adet dolap" gibi) code'lu alt kayıtlarla sınırlı
  // kalmalı. İkisini ayrı tutuyoruz.
  const registeredByCategory = new Map<string, number>()
  const registeredCategoriesPresent = new Set<string>()
  const registeredChildrenByCategory = new Map<string, typeof components.value>()
  for (const c of components.value) {
    registeredCategoriesPresent.add(c.category)
    if (!c.code) continue // kapsayıcı satır — "adet" olarak sayılmaz
    registeredByCategory.set(c.category, (registeredByCategory.get(c.category) ?? 0) + 1)
    if (!registeredChildrenByCategory.has(c.category)) registeredChildrenByCategory.set(c.category, [])
    registeredChildrenByCategory.get(c.category)!.push(c)
  }

  // Sadece GERÇEKTEN KAYITLI bileşeni olan kategoriler listelenir — sabit
  // bir "olası kategoriler" listesi tutulmaz, rapor da tek başına bir
  // kategoriyi var etmez (bkz. yukarıdaki not). Kayıtlı bileşeni olan bir
  // kategoride henüz rapor verisi yoksa (byCategory'de yoksa) aşağıdaki
  // items.length===0 dalı status:null ("Rapor Yok") üretir. "Kayıtlı" burada
  // registeredCategoriesPresent'e göre belirlenir (code'suz whole_unit
  // kayıtlar dahil) — registeredByCategory'ye göre DEĞİL, o sadece sayım içindir.
  const categories = new Set<string>([...registeredCategoriesPresent])

  return Array.from(categories).map((category) => {
    const items = byCategory.get(category) ?? []
    const registeredCount = registeredByCategory.get(category) ?? 0

    const pumpBreakdown = category === 'yangin_pompasi'
      ? {
          main: (registeredChildrenByCategory.get(category) ?? []).filter(c => !(c.code ?? '').toLocaleLowerCase('tr-TR').includes('jokey')).length,
          jokey: (registeredChildrenByCategory.get(category) ?? []).filter(c => (c.code ?? '').toLocaleLowerCase('tr-TR').includes('jokey')).length,
        }
      : null

    if (items.length === 0) {
      return {
        category,
        items: [],
        registeredCount,
        unitCount: registeredCount,
        unitsNonconform: 0,
        controlItemCount: 0,
        nonconformCount: 0,
        status: null,
        pumpBreakdown,
      }
    }

    const codes = [...new Set(items.map(i => i.equipment_code).filter((v): v is string => !!v))]
    const unitsNonconform = codes.filter(code =>
      items.some(i => i.equipment_code === code && i.status === 'uygun_degil'),
    ).length

    const maddeCodes = [...new Set(items.map(i => i.code).filter((v): v is string => !!v))]
    const maddeStatuses = maddeCodes.length
      ? maddeCodes.map(code => items.some(i => i.code === code && i.status === 'uygun_degil') ? 'uygun_degil' : 'uygun')
      // Madde kodu hiç yoksa (örn. tek satırlık serbest metin bulgusu), satır
      // sayısının kendisi "madde" kabul edilir — geri dönüş, veri kaybetmez.
      : items.map(i => i.status === 'uygun_degil' ? 'uygun_degil' : 'uygun')

    return {
      category,
      items,
      registeredCount,
      // Kayıtlı bileşen sayısı varsa o TERCİH edilir (kalıcı gerçek),
      // yoksa raporun kendi kod sayısına düşülür.
      unitCount: registeredCount > 0 ? registeredCount : codes.length,
      unitsNonconform,
      controlItemCount: maddeStatuses.length,
      nonconformCount: maddeStatuses.filter(s => s === 'uygun_degil').length,
      status: maddeStatuses.includes('uygun_degil') ? 'uygun_degil' : 'uygun',
      pumpBreakdown,
    }
  })
})

const CATEGORY_UNIT_NOUN: Partial<Record<string, string>> = {
  sprinkler: 'başlık',
  yangin_dolabi: 'dolap',
  hidrant: 'hidrant',
  yangin_pompasi: 'pompa',
  su_deposu: 'depo',
  sabit_boru: 'hat',
  gazli_sondurme: 'sistem',
}

const systemAmountLabel = (s: SystemSummary): string => {
  if (s.pumpBreakdown) return `${s.pumpBreakdown.main} ana + ${s.pumpBreakdown.jokey} jokey pompa`
  if (s.unitCount > 0) return `${s.unitCount} adet ${CATEGORY_UNIT_NOUN[s.category] ?? 'birim'}`
  return 'Tesisat geneli'
}

const overallSummary = computed(() => {
  const items = report.value?.control_items ?? []
  const uygun = systemSummaries.value.reduce((sum, s) => sum + (s.controlItemCount - s.nonconformCount), 0)
  const uygunDegil = systemSummaries.value.reduce((sum, s) => sum + s.nonconformCount, 0)
  const totalUnits = systemSummaries.value.reduce((sum, s) => sum + s.unitCount, 0)
  return {
    // "Tespit Edilen Sistem" — sadece GERÇEKTEN veri (kayıt ve/veya rapor)
    // bulunan sistemler sayılır; status:null ("Rapor Yok") olan, sadece
    // tam liste için gösterilen placeholder kategoriler bu sayıya dahil
    // edilmez (bkz. referans tasarım: 7 kart ama "Toplam Sistem: 6").
    systemCount: systemSummaries.value.filter(s => s.status !== null || s.registeredCount > 0).length,
    totalUnits,
    controlItemCount: systemSummaries.value.reduce((sum, s) => sum + s.controlItemCount, 0),
    uygun,
    uygunDegil,
    // Şu an raporda "uygulanamıyor" durumu madde bazında ayrıca izlenmiyor
    // (equipment_list parser'ı bu statüyü üretmiyor) — bu yüzden bu sayı
    // sadece ham satırlardan gelen, henüz madde bazında tekilleştirilmemiş
    // bir tahmindir.
    uygulanamiyor: items.filter(i => i.status === 'uygulanamiyor').length,
  }
})

const maxNonconform = computed(() => Math.max(1, ...systemSummaries.value.map(s => s.nonconformCount)))

// --- Sistemi tek tıkla sil ---
// Yanlışlıkla eklenen bir sistemi (Su Deposu gibi TEK kayıtlı whole_unit
// kategoriler dahil, Yangın Dolapları gibi ÇOK kayıtlı per_unit kategoriler
// dahil) kategori detay sayfasına hiç girmeden, doğrudan ana ekrandan
// silebilmek için — kategoriye kayıtlı TÜM bileşenleri tek seferde siler.
// (Tek bileşenli whole_unit kategorilerde zaten tek kayıt vardır, farkı yok.)
const componentsForCategory = (category: string) => components.value.filter(c => c.category === category)

const deletingCategory = ref<string | null>(null)
const deleteSystemCategory = async (s: SystemSummary) => {
  const items = componentsForCategory(s.category)
  if (!items.length || deletingCategory.value) return

  const confirmMessage = items.length === 1
    ? `"${categoryLabel(s.category)}" sistemini tesisat envanterinizden kalıcı olarak silmek istediğinize emin misiniz?`
    : `"${categoryLabel(s.category)}" sistemine kayıtlı ${items.length} bileşenin TAMAMINI kalıcı olarak silmek istediğinize emin misiniz?`
  if (!window.confirm(confirmMessage)) return

  deletingCategory.value = s.category
  try {
    const results = await Promise.allSettled(items.map(item => fireSuppressionInventoryApi.remove(item.id)))
    const failedCount = results.filter(r => r.status === 'rejected').length

    if (failedCount === 0) {
      $toast.success(items.length === 1 ? 'Sistem silindi.' : `${items.length} bileşen silindi.`)
    } else if (failedCount < items.length) {
      $toast.error(`${items.length - failedCount} bileşen silindi, ${failedCount} tanesi rapor/kontrol geçmişi olduğu için silinemedi.`)
    } else {
      $toast.error('Bu sistem silinemedi — muhtemelen rapor/kontrol geçmişi var, önce pasife alabilirsiniz.')
    }
    await load()
  } finally {
    deletingCategory.value = null
  }
}

const resultMeta = (status?: string | null) => status === 'uygun'
  ? { label: 'Uygun', textCls: 'text-emerald-600', bgCls: 'bg-emerald-50 dark:bg-emerald-500/10' }
  : { label: 'Uygun Değil', textCls: 'text-[#d71920]', bgCls: 'bg-red-50 dark:bg-red-500/10' }

// --- "Sistem Ekle" — periyodik kontrol raporu henüz yükleyememiş bir
// kullanıcının bile tesisatındaki bilinen sistem/bileşenleri kaydedebilmesi
// için (bkz. sayfa mimarisi notu yukarıda: bileşenler rapordan BAĞIMSIZ,
// kalıcı gerçekliktir). Aynı fireSuppressionInventoryApi.create() uç
// noktasını kullanır — CRUD katmanı zaten var, sadece bu ekrandan da
// erişilebilir hale getiriliyor.
const addSystemOpen = ref(false)
const addSystemSaving = ref(false)
const addSystemForm = ref({ category: 'yangin_dolabi' as FireSuppressionCategory, code: '', display_name: '', location_note: '' })

const openAddSystem = () => {
  addSystemForm.value = { category: 'yangin_dolabi', code: '', display_name: '', location_note: '' }
  addSystemOpen.value = true
}
const closeAddSystem = () => { addSystemOpen.value = false }

const submitAddSystem = async () => {
  if (!context.branchId || addSystemSaving.value) return
  addSystemSaving.value = true
  try {
    await fireSuppressionInventoryApi.create(context.branchId, {
      category: addSystemForm.value.category,
      code: addSystemForm.value.code || null,
      display_name: addSystemForm.value.display_name || null,
      location_note: addSystemForm.value.location_note || null,
    })
    $toast.success('Sistem bileşeni eklendi.')
    addSystemOpen.value = false
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Sistem bileşeni eklenemedi.')
  } finally {
    addSystemSaving.value = false
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
          <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>

          <template v-else>
            <section class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 class="text-2xl font-bold text-[#172033] dark:text-white">Yangın Tesisatı</h1>
                <p class="text-sm font-semibold text-gray-500">Son Durum</p>
                <p class="mt-0.5 text-xs text-gray-400">Tesisatın güncel durumu — son onaylanmış periyodik kontrol raporuna ve kayıtlı sistem bileşenlerine göre.</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" @click="openAddSystem"><Plus :size="15" />Sistem Ekle</button>
                <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"><History :size="15" />Rapor Geçmişi</NuxtLink>
                <a v-if="report" :href="report.file_url" target="_blank" rel="noopener" class="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><FileText :size="15" />Raporu Görüntüle</a>
              </div>
            </section>

            <!-- Genel Durum: rapor varsa sonucuna göre kırmızı/yeşil, yoksa nötr bilgi bandı -->
            <section v-if="report" class="mb-5 rounded-xl border border-red-100 bg-red-50/60 p-5 dark:border-red-500/20 dark:bg-red-500/10">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d71920] text-white"><XCircle :size="22" /></span>
                  <div>
                    <p class="text-xs font-semibold text-[#d71920]">Genel Durum</p>
                    <p class="text-xl font-bold text-[#d71920]">{{ resultMeta(report.overall_result).label }}</p>
                    <p class="text-xs text-red-600/80 dark:text-red-400/80">Son periyodik kontrolde tesisat için uygunsuzluklar tespit edildi.</p>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-6 lg:gap-8">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#d71920] dark:bg-black/20"><Calendar :size="16" /></span>
                    <div>
                      <p class="text-[11px] text-gray-500 dark:text-gray-400">Son Kontrol</p>
                      <p class="text-sm font-bold text-[#172033] dark:text-white">{{ formatDate(report.report_date) }}</p>
                      <p v-if="formatWeekday(report.report_date)" class="text-[10px] text-gray-400">{{ formatWeekday(report.report_date) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#d71920] dark:bg-black/20"><CalendarClock :size="16" /></span>
                    <div>
                      <p class="text-[11px] text-gray-500 dark:text-gray-400">Geçerlilik Tarihi</p>
                      <p class="text-sm font-bold text-[#172033] dark:text-white">{{ formatDate(report.next_control_date) }}</p>
                      <span v-if="daysRemaining(report.next_control_date) !== null" class="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold" :class="(daysRemaining(report.next_control_date) ?? 0) < 0 ? 'bg-red-100 text-[#d71920]' : 'bg-amber-100 text-amber-700'">
                        {{ (daysRemaining(report.next_control_date) ?? 0) < 0 ? `${Math.abs(daysRemaining(report.next_control_date) ?? 0)} gün gecikti` : `${daysRemaining(report.next_control_date)} gün kaldı` }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#d71920] dark:bg-black/20"><FileText :size="16" /></span>
                    <div>
                      <p class="text-[11px] text-gray-500 dark:text-gray-400">Rapor No</p>
                      <p class="text-sm font-bold text-[#172033] dark:text-white">{{ report.report_no || '—' }}</p>
                      <p v-if="report.inspection_company_name" class="text-[10px] text-gray-400">{{ report.inspection_company_name }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section v-else class="mb-5 rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5"><FileText :size="20" /></span>
                  <div>
                    <p class="text-sm font-bold text-[#172033] dark:text-white">Henüz periyodik kontrol raporu bulunmuyor</p>
                    <p class="text-xs text-gray-400">
                      <span v-if="systemSummaries.length">Sistemde kayıtlı tesisat bilgileri mevcut. </span>İlk periyodik kontrol raporunu yüklediğinizde kontrol sonuçları burada gösterilecektir.
                    </p>
                  </div>
                </div>
                <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#d71920] px-4 text-sm font-semibold text-white hover:bg-[#b9151b]"><FileText :size="15" />Rapor Yükle</NuxtLink>
              </div>
            </section>

            <div v-if="!systemSummaries.length" class="rounded-xl border border-dashed border-[#dfe3e8] bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
              <p class="mb-1 text-sm font-semibold text-[#172033] dark:text-white">Bu lokasyon için henüz sistem/bileşen kaydı yok</p>
              <p class="mb-4 text-xs text-gray-400">Sistemleri elle ekleyebilir veya bir periyodik kontrol raporu yükleyebilirsiniz.</p>
              <button type="button" class="inline-flex items-center gap-2 rounded-lg bg-[#d71920] px-4 py-2.5 text-sm font-semibold text-white" @click="openAddSystem"><Plus :size="15" />Sistem Ekle</button>
            </div>

            <template v-else>

            <section class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <span class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10"><Layers :size="16" /></span>
                <p class="text-2xl font-bold leading-none text-[#172033] dark:text-white">{{ overallSummary.systemCount }}</p>
                <p class="mt-1 text-[11px] text-gray-400">Tespit Edilen Sistem</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <span class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10"><Box :size="16" /></span>
                <p class="text-2xl font-bold leading-none text-[#172033] dark:text-white">{{ overallSummary.totalUnits }}</p>
                <p class="mt-1 text-[11px] text-gray-400">Toplam Ekipman</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <span class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10"><ClipboardList :size="16" /></span>
                <p class="text-2xl font-bold leading-none text-[#172033] dark:text-white">{{ overallSummary.controlItemCount }}</p>
                <p class="mt-1 text-[11px] text-gray-400">Kontrol Maddesi</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <span class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 :size="16" /></span>
                <p class="text-2xl font-bold leading-none text-emerald-600">{{ overallSummary.uygun }}</p>
                <p class="mt-1 text-[11px] text-gray-400">Uygun</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <span class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><XCircle :size="16" /></span>
                <p class="text-2xl font-bold leading-none text-[#d71920]">{{ overallSummary.uygunDegil }}</p>
                <p class="mt-1 text-[11px] text-gray-400">Uygun Değil</p>
              </div>
              <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <span class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5"><MinusCircle :size="16" /></span>
                <p class="text-2xl font-bold leading-none text-gray-500 dark:text-gray-300">{{ overallSummary.uygulanamiyor }}</p>
                <p class="mt-1 text-[11px] text-gray-400">Uygulanması Yok</p>
              </div>
            </section>

            <section class="grid gap-4 lg:grid-cols-3">
              <div class="space-y-4 lg:col-span-2">
                <div class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
                  <div class="border-b border-[#f1f2f4] px-5 py-4 dark:border-gray-800">
                    <p class="text-sm font-bold text-[#172033] dark:text-white">Sistem Bazlı Durum</p>
                    <p class="text-[11px] text-gray-400">Son raporda tespit edilen yangın tesisatı bileşenlerinin durumu.</p>
                  </div>
                  <div v-if="!systemSummaries.length" class="py-10 text-center text-xs text-gray-400">Bu raporda sistem/kontrol maddesi tespit edilmedi.</div>
                  <table v-else class="w-full text-left text-sm">
                    <thead>
                      <tr class="border-b border-[#f1f2f4] text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                        <th class="px-5 py-2.5">Sistem</th>
                        <th class="px-3 py-2.5">Miktar / Bilgi</th>
                        <th class="px-3 py-2.5">Durum</th>
                        <th class="px-3 py-2.5">Kontrol Maddesi</th>
                        <th class="px-3 py-2.5">Uygunsuzluk</th>
                        <th class="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="s in systemSummaries" :key="s.category" class="cursor-pointer border-b border-[#f1f2f4] last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5" @click="navigateTo(`/isg-portal/desktop/fire-suppression/systems/${s.category}`)">
                        <td class="px-5 py-3">
                          <div class="flex items-center gap-2.5">
                            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10"><component :is="categoryIcon(s.category)" :size="15" /></span>
                            <span class="font-semibold text-[#172033] dark:text-white">{{ categoryLabel(s.category) }}</span>
                          </div>
                        </td>
                        <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                          <p>{{ systemAmountLabel(s) }}</p>
                          <p v-if="s.unitsNonconform > 0" class="font-semibold text-[#d71920]">{{ s.unitsNonconform }} / {{ s.unitCount }} uygunsuz</p>
                        </td>
                        <td class="px-3 py-3">
                          <span v-if="s.status === null" class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                            <span class="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            Rapor Yok
                          </span>
                          <span v-else class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="s.status === 'uygun' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-[#d71920] dark:bg-red-500/10'">
                            <span class="h-1.5 w-1.5 rounded-full" :class="s.status === 'uygun' ? 'bg-emerald-500' : 'bg-[#d71920]'" />
                            {{ s.status === 'uygun' ? 'Uygun' : 'Uygun Değil' }}
                          </span>
                        </td>
                        <td class="px-3 py-3 font-semibold text-[#172033] dark:text-white">{{ s.controlItemCount || '—' }}</td>
                        <td class="px-3 py-3 font-semibold" :class="s.nonconformCount > 0 ? 'text-[#d71920]' : 'text-gray-400'">{{ s.status === null ? '—' : s.nonconformCount }}</td>
                        <td class="px-3 py-3 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              class="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-[#d71920] disabled:opacity-40 dark:hover:bg-red-500/10"
                              title="Sistemi sil"
                              :disabled="deletingCategory === s.category"
                              @click.stop="deleteSystemCategory(s)"
                            >
                              <Trash2 :size="15" />
                            </button>
                            <ChevronRight :size="16" class="text-gray-300" />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p class="mb-4 text-sm font-bold text-[#172033] dark:text-white">Tesisat Bilgileri</p>
                  <dl class="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    <div class="flex items-center justify-between border-b border-[#f5f6f8] pb-2 dark:border-gray-800"><dt class="text-xs text-gray-400">Sistem Tipi</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">—</dd></div>
                    <div class="flex items-center justify-between border-b border-[#f5f6f8] pb-2 dark:border-gray-800"><dt class="text-xs text-gray-400">Yangın Pompası</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">{{ systemSummaries.find(s => s.category === 'yangin_pompasi') ? systemAmountLabel(systemSummaries.find(s => s.category === 'yangin_pompasi')!) : '—' }}</dd></div>
                    <div class="flex items-center justify-between border-b border-[#f5f6f8] pb-2 dark:border-gray-800"><dt class="text-xs text-gray-400">Su Deposu Kapasitesi</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">—</dd></div>
                    <div class="flex items-center justify-between border-b border-[#f5f6f8] pb-2 dark:border-gray-800"><dt class="text-xs text-gray-400">Yangın Dolabı</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">{{ systemSummaries.find(s => s.category === 'yangin_dolabi')?.unitCount ? `${systemSummaries.find(s => s.category === 'yangin_dolabi')!.unitCount} adet` : '—' }}</dd></div>
                    <div class="flex items-center justify-between border-b border-[#f5f6f8] pb-2 dark:border-gray-800 sm:border-b-0"><dt class="text-xs text-gray-400">Sprinkler Tipi</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">—</dd></div>
                    <div class="flex items-center justify-between border-b border-[#f5f6f8] pb-2 dark:border-gray-800"><dt class="text-xs text-gray-400">Hidrant</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">{{ systemSummaries.find(s => s.category === 'hidrant')?.unitCount ? `${systemSummaries.find(s => s.category === 'hidrant')!.unitCount} adet` : '—' }}</dd></div>
                    <div class="flex items-center justify-between pb-2 sm:col-start-2"><dt class="text-xs text-gray-400">Bina Yüksekliği</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">—</dd></div>
                  </dl>
                </div>
              </div>

              <div class="space-y-4">
                <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p class="text-sm font-bold text-[#172033] dark:text-white">Uygunsuzlukların Sistemlere Göre Dağılımı</p>
                  <p class="mb-4 text-[11px] text-gray-400">Tespit edilen uygunsuz kontrol maddelerinin sistemlere göre dağılımı.</p>
                  <div v-if="!systemSummaries.length" class="py-6 text-center text-xs text-gray-400">Veri yok.</div>
                  <div v-else class="space-y-2.5">
                    <div v-for="s in systemSummaries" :key="s.category" class="flex items-center gap-3">
                      <p class="w-28 shrink-0 truncate text-xs text-gray-500 dark:text-gray-400">{{ categoryLabel(s.category) }}</p>
                      <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                        <div class="h-full rounded-full" :class="s.nonconformCount > 0 ? 'bg-[#d71920]' : 'bg-gray-200 dark:bg-white/10'" :style="{ width: `${(s.nonconformCount / maxNonconform) * 100}%` }" />
                      </div>
                      <p class="w-4 shrink-0 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{{ s.nonconformCount }}</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p class="mb-4 text-sm font-bold text-[#172033] dark:text-white">Rapor Bilgileri</p>
                  <template v-if="report">
                    <dl class="space-y-3">
                      <div class="flex items-center justify-between"><dt class="text-xs text-gray-400">Rapor No</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">{{ report.report_no || '—' }}</dd></div>
                      <div class="flex items-center justify-between"><dt class="text-xs text-gray-400">Muayene Tarihi</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">{{ formatDate(report.report_date) }}</dd></div>
                      <div class="flex items-center justify-between"><dt class="text-xs text-gray-400">Geçerlilik Tarihi</dt><dd class="text-xs font-semibold text-[#172033] dark:text-white">{{ formatDate(report.next_control_date) }}</dd></div>
                      <div class="flex items-center justify-between"><dt class="text-xs text-gray-400">Akredite Firma</dt><dd class="text-right text-xs font-semibold text-[#172033] dark:text-white">{{ report.inspection_company_name || '—' }}</dd></div>
                    </dl>
                    <a :href="report.file_url" target="_blank" rel="noopener" class="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"><FileText :size="15" />Raporu Görüntüle</a>
                  </template>
                  <template v-else>
                    <p class="text-xs text-gray-400">Henüz rapor yüklenmedi.</p>
                    <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#d71920] text-sm font-semibold text-white hover:bg-[#b9151b]"><FileText :size="15" />Rapor Yükle</NuxtLink>
                  </template>
                </div>
              </div>
            </section>

            <div v-if="report" class="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Info :size="15" class="mt-0.5 shrink-0" />
              <p>Bu ekranda yer alan bilgiler, {{ formatDate(report.report_date) }} tarihli {{ report.report_no || '—' }} numaralı periyodik kontrol raporundan alınmıştır.</p>
            </div>
            </template>
          </template>
        </div>
      </main>
    </div>

    <!-- Sistem Ekle -->
    <div v-if="addSystemOpen" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30 p-4" @click.self="closeAddSystem">
      <div class="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm font-bold text-[#172033] dark:text-white">Sistem Ekle</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeAddSystem"><X :size="16" /></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Sistem</label>
            <select v-model="addSystemForm.category" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option v-for="c in categorySettings.enabledCategories.value" :key="c" :value="c">{{ categoryLabel(c) }}</option>
            </select>
            <p class="mt-1 text-[11px] text-gray-400">Sistem türü listesi Ayarlar &gt; Sistem Adları'ndan yönetilir.</p>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Görünen Ad (opsiyonel)</label>
            <input v-model="addSystemForm.display_name" type="text" placeholder="Örn. Çatı Su Deposu" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            <p class="mt-1 text-[11px] text-gray-400">Bu bileşeni tesisatınızda nasıl adlandırdığınız — sistem türü (yukarıdaki "Sistem") sabit kalır, sadece ekranlarda görünen ad değişir.</p>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kod (opsiyonel)</label>
            <input v-model="addSystemForm.code" type="text" placeholder="Örn. YD-01" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Konum Notu (opsiyonel)</label>
            <input v-model="addSystemForm.location_note" type="text" placeholder="Örn. Pompa Dairesi" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
        </div>
        <div class="mt-5 flex gap-2">
          <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="addSystemSaving" @click="closeAddSystem">Vazgeç</button>
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="addSystemSaving" @click="submitAddSystem">Ekle</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
