<script setup lang="ts">
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cylinder,
  Droplets,
  FileText,
  FireExtinguisher,
  Gauge,
  History,
  LoaderCircle,
  Info,
  Layers,
  List,
  Plus,
  ShieldCheck,
  Trash2,
  Waves,
  X,
  XCircle,
} from '@lucide/vue'
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
import { useWorkspaceTheme } from '~/composables/useWorkspaceTheme'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()
const categorySettings = useFireSuppressionCategorySettings()
const { color: workspaceColor, load: loadWorkspaceTheme } = useWorkspaceTheme()
const { user } = useAuth()

const report = ref<FireSuppressionReport | null>(null)
const components = ref<FireSuppressionInventoryItem[]>([])
const loading = ref(true)
const activeTab = ref('systems')
const showAddModal = ref(false)
const adding = ref(false)
const newCategory = ref<FireSuppressionCategory>('yangin_dolabi')
const newName = ref('')
const newCode = ref('')

const primaryColor = computed(() => workspaceColor.value || '#d71920')

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
  loadWorkspaceTheme(Number(user.value?.tenant_id ?? 0) || null)
})

watch(() => context.branchId, load)

const CATEGORY_ICONS: Partial<Record<string, typeof Droplets>> = {
  sprinkler: Droplets,
  yangin_dolabi: FireExtinguisher,
  hidrant: Waves,
  yangin_pompasi: Gauge,
  su_deposu: Cylinder,
  sabit_boru: Waves,
  su_alma_verme: Waves,
  gazli_sondurme: ShieldCheck,
  yangin_algilama: Bell,
  diger: FileText,
}

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

const categoryIcon = (category: string) => CATEGORY_ICONS[category] ?? FileText

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

const daysRemaining = (value?: string | null) => {
  if (!value) return null
  const target = new Date(value)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

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

const statusLabel = (status: SystemSummary['status']) => {
  if (status === 'uygun') return 'Uygun'
  if (status === 'uygun_degil') return 'Uygunsuzluk Var'
  return 'Kontrol Edilmedi'
}

const statusClass = (status: SystemSummary['status']) => {
  if (status === 'uygun') return 'status-success'
  if (status === 'uygun_degil') return 'status-danger'
  return 'status-neutral'
}

const amountLabel = (item: SystemSummary) => {
  if (item.pumpBreakdown) return `${item.pumpBreakdown.main} ana + ${item.pumpBreakdown.jokey} jokey pompa`
  if (item.unitCount > 0) return `${item.unitCount} adet ${item.category === 'yangin_dolabi' ? 'dolap' : item.category === 'sprinkler' ? 'başlık' : 'birim'}`
  return 'Tesisat geneli'
}

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
          <section class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-[0.18em]" :style="{ color: primaryColor }">YANGIN SÖNDÜRME SİSTEMLERİ</p>
              <h1 class="mt-1 text-2xl font-bold tracking-tight text-[#14284f] dark:text-white sm:text-[30px]">Yangın Tesisatı Durumu</h1>
              <p class="mt-1 text-sm text-slate-500">Son periyodik kontrol raporuna göre tesisatın genel durumu ve sistem bazlı sonuçları.</p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#14284f] shadow-sm transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white" @click="showAddModal = true"><Plus :size="17" />Sistem Ekle</button>
              <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#14284f] shadow-sm transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><History :size="17" />Rapor Geçmişi</NuxtLink>
            </div>
          </section>

          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div class="grid divide-y divide-slate-100 md:grid-cols-4 md:divide-x md:divide-y-0 dark:divide-gray-800">
              <div class="flex items-center gap-4 p-4 md:p-5"><div :class="['flex h-14 w-14 shrink-0 items-center justify-center rounded-xl', overallStatusClass === 'is-danger' ? 'bg-red-50 text-red-500' : overallStatusClass === 'is-success' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500']"><XCircle v-if="overallStatusClass === 'is-danger'" :size="29"/><CheckCircle2 v-else-if="overallStatusClass === 'is-success'" :size="29"/><Info v-else :size="27"/></div><div class="min-w-0"><p class="text-xs font-medium text-slate-500">Genel Durum</p><p class="mt-0.5 text-lg font-bold" :style="{color:overallStatusClass==='is-success'?'#16a66a':overallStatusClass==='is-danger'?primaryColor:'#64748b'}">{{overallStatus}}</p><p class="mt-0.5 text-[11px] leading-4 text-slate-400">{{report?'Son rapora göre tesisat sonucu.':'Henüz geçerli periyodik kontrol raporu bulunmuyor.'}}</p></div></div>
              <div class="flex items-center gap-4 p-4 md:p-5"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500"><Calendar :size="24"/></div><div><p class="text-xs font-medium text-slate-500">Son Periyodik Kontrol</p><p class="mt-1 text-base font-bold text-[#14284f] dark:text-white">{{formatDate(report?.report_date)}}</p><p class="mt-0.5 text-xs text-slate-400">{{latestControlLabel}}</p></div></div>
              <div class="flex items-center gap-4 p-4 md:p-5"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500"><ShieldCheck :size="24"/></div><div><p class="text-xs font-medium text-slate-500">Geçerlilik Tarihi</p><p class="mt-1 text-base font-bold text-[#14284f] dark:text-white">{{formatDate(report?.next_control_date)}}</p><p v-if="daysRemaining(report?.next_control_date)!==null" class="mt-0.5 text-xs font-semibold text-emerald-500">Kalan süre: {{daysRemaining(report?.next_control_date)}} gün</p><p v-else class="mt-0.5 text-xs text-slate-400">Tarih bilgisi bulunmuyor.</p></div></div>
              <div class="flex items-center gap-4 p-4 md:p-5"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><FileText :size="24"/></div><div class="min-w-0"><p class="text-xs font-medium text-slate-500">Rapor No</p><p class="mt-1 truncate text-base font-bold text-[#14284f] dark:text-white">{{report?.report_no||'—'}}</p><a v-if="report" :href="report.file_url" target="_blank" rel="noopener" class="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold underline" :style="{color:primaryColor}">Raporu Görüntüle <ArrowRight :size="13"/></a></div></div>
            </div>
          </section>

          <nav class="mt-5 flex gap-7 overflow-x-auto border-b border-slate-200" aria-label="Tesisat sekmeleri">
            <button v-for="tab in [{id:'systems',label:'Sistemler',anchor:'systems'},{id:'general',label:'Genel Bilgiler',anchor:'general'},{id:'controls',label:'Kontrol Maddeleri',anchor:'controls'},{id:'findings',label:'Uygunsuzluklar',anchor:'findings'},{id:'summary',label:'Özet',anchor:'summary'},{id:'files',label:'Dosyalar',anchor:'files'}]" :key="tab.id" class="relative shrink-0 pb-3 text-xs font-semibold transition" :style="activeTab===tab.id?{color:primaryColor}:{color:'#50617f'}" @click="goToTab(tab.id,tab.anchor)">{{tab.label}}<span v-if="activeTab===tab.id" class="absolute inset-x-0 bottom-0 h-0.5 rounded-full" :style="{backgroundColor:primaryColor}"/></button>
          </nav>

          <section id="systems" class="scroll-mt-24 pt-5">
            <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 class="text-xl font-bold text-[#14284f] dark:text-white">Sistem Bazlı Durum</h2><p class="text-sm text-slate-500">Son rapora göre yangın tesisatında bulunan sistemlerin kontrol sonuçları.</p></div><div class="flex items-center gap-2"><button class="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-white shadow-sm" :style="{backgroundColor:primaryColor}"><Layers :size="15"/> Kart Görünümü</button><button class="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#50617f] dark:border-gray-700 dark:bg-gray-900 dark:text-white"><List :size="15"/> Liste Görünümü</button></div></div>
            <div v-if="loading" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><div v-for="n in 6" :key="n" class="h-32 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900"/></div>
            <div v-else-if="!systemSummaries.length" class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900"><Layers class="mx-auto text-slate-300" :size="32"/><p class="mt-3 text-sm font-semibold text-slate-700 dark:text-white">Henüz kayıtlı yangın tesisatı sistemi bulunmuyor.</p><p class="mt-1 text-xs text-slate-400">Sistem Ekle ile tesisat envanterini oluşturmaya başlayabilirsiniz.</p></div>
            <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <NuxtLink v-for="system in systemSummaries" :key="system.category" :to="`/isg-portal/desktop/fire-suppression/systems/${system.category}`" class="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-start justify-between gap-3"><div class="flex min-w-0 items-center gap-3"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:bg-gray-800 dark:text-slate-300"><component :is="categoryIcon(system.category)" :size="24"/></div><div class="min-w-0"><h3 class="truncate text-sm font-bold text-[#14284f] dark:text-white">{{categoryLabel(system.category)}}</h3><p class="mt-0.5 truncate text-xs text-slate-500">{{amountLabel(system)}}</p></div></div><ChevronRight :size="19" class="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" :style="{color:primaryColor}"/></div>
                <div class="mt-3"><span :class="['inline-flex rounded-md px-2 py-1 text-[11px] font-bold',statusClass(system.status)]">{{statusLabel(system.status)}}</span></div>
                <div v-if="system.nonconformCount>0" class="mt-3"><div class="mb-1 flex items-center justify-between text-[11px] font-semibold"><span class="text-slate-400">{{system.controlItemCount}} kontrol maddesi</span><span class="text-red-500">{{system.nonconformCount}} / {{system.controlItemCount}} uygunsuz</span></div><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-red-400" :style="{width:`${Math.min(100,(system.nonconformCount/Math.max(1,system.controlItemCount))*100)}%`}"/></div></div>
                <div v-else class="mt-3 flex items-center gap-2 text-xs text-slate-500"><span>{{system.controlItemCount}} kontrol maddesi</span><span class="text-slate-300">|</span><span>{{system.nonconformCount}} uygunsuzluk</span></div>
              </NuxtLink>
            </div>
          </section>

          <section id="summary" class="scroll-mt-24 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div v-for="card in [{value:overallSummary.systemCount,label:'Tespit Edilen Sistem',icon:Layers,tone:'violet'},{value:overallSummary.totalUnits,label:'Toplam Ekipman',icon:Cylinder,tone:'blue'},{value:overallSummary.controls,label:'Kontrol Maddesi',icon:ClipboardList,tone:'sky'},{value:overallSummary.suitable,label:'Uygun',icon:CheckCircle2,tone:'green'},{value:overallSummary.unsuitable,label:'Uygun Değil',icon:XCircle,tone:'red'},{value:overallSummary.notApplicable,label:'Uygulanması Yok',icon:Info,tone:'gray'}]" :key="card.label" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div :class="['flex h-9 w-9 items-center justify-center rounded-lg',`tone-${card.tone}`]"><component :is="card.icon" :size="17"/></div><p class="mt-3 text-xl font-bold text-[#14284f] dark:text-white">{{card.value}}</p><p class="mt-0.5 text-[11px] text-slate-400">{{card.label}}</p></div>
          </section>

          <section class="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(300px,.9fr)]">
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Kontrol Sonuçlarının Dağılımı</h3><div class="mt-4 flex items-center justify-center gap-8"><div class="relative h-40 w-40 shrink-0 rounded-full p-4" :style="ringStyle"><div class="flex h-full w-full flex-col items-center justify-center rounded-full bg-white dark:bg-gray-900"><strong class="text-2xl text-[#14284f] dark:text-white">{{overallSummary.controls}}</strong><span class="text-[10px] text-slate-400">Kontrol Maddesi</span></div></div><div class="space-y-3 text-xs"><div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-emerald-400"/><span class="text-slate-500">Uygun</span><strong>{{overallSummary.suitable}} ({{suitablePercent}}%)</strong></div><div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-red-400"/><span class="text-slate-500">Uygun Değil</span><strong>{{overallSummary.unsuitable}} ({{unsuitablePercent}}%)</strong></div><div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-slate-400"/><span class="text-slate-500">Uygulaması Yok</span><strong>{{overallSummary.notApplicable}} ({{noResultPercent}}%)</strong></div></div></div></div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Sistemlere Göre Uygunsuzluk Sayısı</h3><div class="mt-4 space-y-3"><div v-for="system in systemSummaries" :key="`bar-${system.category}`" class="grid grid-cols-[120px_minmax(0,1fr)_24px] items-center gap-2 text-xs"><span class="truncate text-slate-500">{{categoryLabel(system.category)}}</span><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-red-400" :style="{width:`${(system.nonconformCount/maxNonconform)*100}%`}"/></div><strong class="text-right text-[#14284f] dark:text-white">{{system.nonconformCount}}</strong></div></div></div>
            <div id="general" class="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Tesisat Bilgileri (Rapor'dan)</h3><div class="mt-3 divide-y divide-slate-100 dark:divide-gray-800"><div v-for="info in facilityInfo" :key="info.label" class="flex items-center justify-between gap-4 py-2 text-xs"><span class="text-slate-400">{{info.label}}</span><strong class="text-right text-[#14284f] dark:text-white">{{info.value}}</strong></div></div></div>
          </section>

          <section id="controls" class="scroll-mt-24 mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div class="flex items-center justify-between gap-4"><div><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Kontrol Maddeleri</h3><p class="mt-1 text-xs text-slate-400">Son rapordaki benzersiz kontrol maddeleri.</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{{overallSummary.controls}} madde</span></div><div class="mt-4 grid gap-2 md:grid-cols-2"><div v-for="item in [...(report?.control_items??[])].filter((value,index,list)=>value.code?list.findIndex(x=>x.code===value.code)===index:true).slice(0,12)" :key="item.id" class="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-gray-800"><span :class="['mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',item.status==='uygun'?'bg-emerald-50 text-emerald-600':item.status==='uygun_degil'?'bg-red-50 text-red-500':'bg-slate-100 text-slate-500']">{{item.status==='uygun'?'✓':item.status==='uygun_degil'?'!':'—'}}</span><div class="min-w-0"><p class="text-xs font-semibold text-[#14284f] dark:text-white">{{item.title}}</p><p class="mt-0.5 text-[10px] text-slate-400">{{item.code||item.section||'Kontrol maddesi'}}</p></div></div></div></section>

          <section id="findings" class="scroll-mt-24 mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div class="flex items-center justify-between"><div><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Uygunsuzluklar</h3><p class="mt-1 text-xs text-slate-400">Son raporda tespit edilen uygunsuzluklar.</p></div><span class="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">{{report?.findings?.length??0}}</span></div><div v-if="report?.findings?.length" class="mt-4 space-y-2"><div v-for="finding in report.findings" :key="finding.id" class="rounded-lg border border-red-100 bg-red-50/40 p-3 dark:border-red-900/30 dark:bg-red-900/10"><p class="text-xs font-semibold text-slate-700 dark:text-white">{{finding.description}}</p><p class="mt-1 text-[10px] text-slate-400">{{categoryLabel(finding.category||'diger')}} · {{finding.status==='open'?'Açık':'Kapalı'}}</p></div></div><p v-else class="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-center text-xs text-slate-400 dark:bg-gray-800">Son raporda kayıtlı uygunsuzluk bulunmuyor.</p></section>

          <section id="files" class="scroll-mt-24 mt-5 mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div class="flex items-center justify-between"><div><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Dosyalar</h3><p class="mt-1 text-xs text-slate-400">Rapor ve ek dosyalar.</p></div><NuxtLink to="/isg-portal/desktop/fire-suppression/reports/upload" class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white" :style="{backgroundColor:primaryColor}"><Plus :size="15"/> Rapor Yükle</NuxtLink></div><div v-if="report?.files?.length" class="mt-4 grid gap-2 md:grid-cols-2"><a v-for="file in report.files" :key="file.id" :href="file.file_url" target="_blank" class="flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-xs hover:bg-slate-50 dark:border-gray-800 dark:hover:bg-gray-800"><FileText :size="18" class="text-slate-400"/><span class="truncate font-semibold text-slate-700 dark:text-white">{{file.file_name}}</span></a></div><div v-else class="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-4 dark:bg-gray-800"><div><p class="text-xs font-semibold text-slate-700 dark:text-white">Henüz ek dosya bulunmuyor.</p><p class="mt-1 text-[10px] text-slate-400">İlk periyodik kontrol raporunu yüklediğinizde dosyalar burada görünür.</p></div><NuxtLink to="/isg-portal/desktop/fire-suppression/reports/upload" class="text-xs font-bold" :style="{color:primaryColor}">Rapor Yükle →</NuxtLink></div></section>
        </div>
      </main>
    </div>
  </div>
  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">Yönlendiriliyor...</div>

  <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="showAddModal=false"><div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"><div class="flex items-center justify-between"><div><h3 class="text-base font-bold text-[#14284f] dark:text-white">Sistem Ekle</h3><p class="mt-1 text-xs text-slate-400">Yangın tesisatı envanterine yeni bir bileşen ekleyin.</p></div><button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100" @click="showAddModal=false"><X :size="18"/></button></div><div class="mt-5 space-y-4"><label class="block"><span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Sistem</span><select v-model="newCategory" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option v-for="category in categorySettings.enabledCategories" :key="category" :value="category">{{categoryLabel(category)}}</option></select></label><label class="block"><span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Ad / Açıklama</span><input v-model="newName" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Örn. Yangın Dolabı 01"/></label><label class="block"><span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Kod</span><input v-model="newCode" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Opsiyonel"/></label></div><div class="mt-6 flex justify-end gap-2"><button class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600" @click="showAddModal=false">Vazgeç</button><button class="rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50" :style="{backgroundColor:primaryColor}" :disabled="adding" @click="addSystem">{{adding?'Ekleniyor...':'Sistemi Ekle'}}</button></div></div></div>
</template>

<style scoped>
.status-success { background: #e9fbf2; color: #10a66a; }
.status-danger { background: #fff0f0; color: #ef4444; }
.status-neutral { background: #eef2f7; color: #51627d; }
.tone-violet { background: #f2edff; color: #7c3aed; }
.tone-blue { background: #edf5ff; color: #2563eb; }
.tone-sky { background: #edf8ff; color: #0ea5e9; }
.tone-green { background: #eafaf2; color: #10a66a; }
.tone-red { background: #fff0f0; color: #ef4444; }
.tone-gray { background: #f1f4f8; color: #64748b; }
</style>
