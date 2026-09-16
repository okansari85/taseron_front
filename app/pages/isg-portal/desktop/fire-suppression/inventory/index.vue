<script setup lang="ts">
import { ArrowRight, Calendar, CalendarClock, CheckCircle2, ChevronRight, ClipboardList, Cylinder, Droplets, FileText, FireExtinguisher, Gauge, History, Info, Layers, List, LoaderCircle, MinusCircle, Plus, ShieldCheck, Trash2, Waves, X, XCircle } from '@lucide/vue'
import { fireSuppressionReportApi } from '~/api/fire-suppression-report'
import { fireSuppressionInventoryApi } from '~/api/fire-suppression-inventory'
import { FIRE_SUPPRESSION_CATEGORY_LABELS, type FireSuppressionCategory, type FireSuppressionInventoryItem } from '~/types/fire-suppression-inventory'
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
const addSystemOpen = ref(false)
const addSystemSaving = ref(false)
const deletingCategory = ref<string | null>(null)
const addSystemForm = ref({ category: 'yangin_dolabi' as FireSuppressionCategory, code: '', display_name: '', location_note: '' })
const primaryColor = computed(() => workspaceColor.value || '#d71920')

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const [reports, inventory] = await Promise.all([fireSuppressionReportApi.list(context.branchId), fireSuppressionInventoryApi.list(context.branchId)])
    components.value = inventory.data
    const latest = reports.data.find(r => r.is_current) ?? reports.data[0] ?? null
    report.value = latest ? (await fireSuppressionReportApi.get(latest.id)).data : null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!context.ready) { navigateTo('/isg-portal/desktop/select-location'); return }
  load()
  categorySettings.load()
  loadWorkspaceTheme(Number(user.value?.tenant_id ?? 0) || null)
})
watch(() => context.branchId, load)

const CATEGORY_ICONS: Partial<Record<string, typeof Droplets>> = { sprinkler: Droplets, yangin_dolabi: FireExtinguisher, hidrant: Waves, yangin_pompasi: Gauge, su_deposu: Cylinder, sabit_boru: Waves, gazli_sondurme: ShieldCheck, diger: FileText }
const CATEGORY_DISPLAY_LABELS: Partial<Record<string, string>> = { yangin_pompasi: 'Yangın Pompa Dairesi', yangin_dolabi: 'Yangın Dolapları', hidrant: 'Hidrant Sistemi', sprinkler: 'Sprinkler Sistemi', su_deposu: 'Yangın Su Deposu', sabit_boru: 'Sabit Boru Tesisatı', gazli_sondurme: 'Gazlı Söndürme' }
const categoryLabel = (category: string) => CATEGORY_DISPLAY_LABELS[category] || categorySettings.label(category) || FIRE_SUPPRESSION_CATEGORY_LABELS[category as FireSuppressionCategory] || category
const categoryIcon = (category: string) => CATEGORY_ICONS[category] ?? FileText
const formatDate = (value?: string | null) => !value ? '—' : new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
const formatWeekday = (value?: string | null) => !value ? null : new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(new Date(value))
const daysRemaining = (value?: string | null) => { if (!value) return null; const d = new Date(value); d.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return Math.round((d.getTime()-t.getTime())/86400000) }

type SystemSummary = { category: string; items: FireSuppressionReportControlItem[]; registeredCount: number; unitCount: number; unitsNonconform: number; controlItemCount: number; nonconformCount: number; status: 'uygun'|'uygun_degil'|null; pumpBreakdown: { main:number; jokey:number }|null }
const systemSummaries = computed<SystemSummary[]>(() => {
  const byCategory = new Map<string, FireSuppressionReportControlItem[]>()
  for (const item of report.value?.control_items ?? []) { const c = item.category ?? 'diger'; if (!byCategory.has(c)) byCategory.set(c, []); byCategory.get(c)!.push(item) }
  const counts = new Map<string,number>(); const present = new Set<string>(); const children = new Map<string,FireSuppressionInventoryItem[]>()
  for (const item of components.value) { present.add(item.category); if (!item.code) continue; counts.set(item.category,(counts.get(item.category)??0)+1); if(!children.has(item.category)) children.set(item.category,[]); children.get(item.category)!.push(item) }
  return [...present].map(category => {
    const items = byCategory.get(category) ?? []; const registeredCount = counts.get(category) ?? 0; const child = children.get(category) ?? []
    const pumpBreakdown = category === 'yangin_pompasi' ? { main: child.filter(x => !(x.code??'').toLocaleLowerCase('tr-TR').includes('jokey')).length, jokey: child.filter(x => (x.code??'').toLocaleLowerCase('tr-TR').includes('jokey')).length } : null
    if (!items.length) return { category, items, registeredCount, unitCount: registeredCount, unitsNonconform: 0, controlItemCount: 0, nonconformCount: 0, status: null, pumpBreakdown }
    const codes = [...new Set(items.map(x=>x.equipment_code).filter((v):v is string=>!!v))]
    const badUnits = codes.filter(code=>items.some(x=>x.equipment_code===code && x.status==='uygun_degil')).length
    const itemCodes = [...new Set(items.map(x=>x.code).filter((v):v is string=>!!v))]
    const statuses = itemCodes.length ? itemCodes.map(code=>items.some(x=>x.code===code && x.status==='uygun_degil')?'uygun_degil':'uygun') : items.map(x=>x.status==='uygun_degil'?'uygun_degil':'uygun')
    return { category, items, registeredCount, unitCount: registeredCount>0?registeredCount:codes.length, unitsNonconform: badUnits, controlItemCount: statuses.length, nonconformCount: statuses.filter(x=>x==='uygun_degil').length, status: statuses.includes('uygun_degil')?'uygun_degil':'uygun', pumpBreakdown }
  })
})
const overallSummary = computed(() => { const suitable=systemSummaries.value.reduce((s,x)=>s+x.controlItemCount-x.nonconformCount,0); const unsuitable=systemSummaries.value.reduce((s,x)=>s+x.nonconformCount,0); return { systemCount: systemSummaries.value.filter(x=>x.status!==null||x.registeredCount>0).length, totalUnits: systemSummaries.value.reduce((s,x)=>s+x.unitCount,0), controlItemCount: systemSummaries.value.reduce((s,x)=>s+x.controlItemCount,0), uygun:suitable, uygunDegil:unsuitable, uygulanamiyor:(report.value?.control_items??[]).filter(x=>x.status==='uygulanamiyor').length } })
const maxNonconform = computed(()=>Math.max(1,...systemSummaries.value.map(x=>x.nonconformCount)))
const overallStatus = computed(()=> report.value?.overall_result==='uygun_degil'||overallSummary.value.uygunDegil>0 ? 'Uygun Değil' : report.value ? 'Uygun' : 'Rapor Yok')
const resultMeta = (status?: string|null) => status==='uygun' ? {label:'Uygun',cls:'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'} : {label:'Uygun Değil',cls:'bg-red-50 text-[#d71920] dark:bg-red-500/10'}
const systemAmountLabel = (s:SystemSummary) => s.pumpBreakdown ? `${s.pumpBreakdown.main} ana + ${s.pumpBreakdown.jokey} jokey pompa` : s.unitCount>0 ? `${s.unitCount} adet ${s.category==='yangin_dolabi'?'dolap':s.category==='sprinkler'?'başlık':'birim'}` : 'Tesisat geneli'
const deleteSystemCategory = async (s:SystemSummary) => { const items=components.value.filter(x=>x.category===s.category); if(!items.length) return; if(!window.confirm(`"${categoryLabel(s.category)}" sistemine ait ${items.length} kayıt silinsin mi?`)) return; deletingCategory.value=s.category; try { const r=await Promise.allSettled(items.map(x=>fireSuppressionInventoryApi.remove(x.id))); const failed=r.filter(x=>x.status==='rejected').length; if(failed===0) $toast.success('Sistem silindi.'); else $toast.error(`${failed} kayıt silinemedi.`); await load() } finally { deletingCategory.value=null } }
const openAddSystem=()=>{ addSystemForm.value={category:'yangin_dolabi',code:'',display_name:'',location_note:''}; addSystemOpen.value=true }
const submitAddSystem=async()=>{ if(!context.branchId||addSystemSaving.value)return; addSystemSaving.value=true; try { await fireSuppressionInventoryApi.create(context.branchId,{category:addSystemForm.value.category,code:addSystemForm.value.code||null,display_name:addSystemForm.value.display_name||null,location_note:addSystemForm.value.location_note||null}); $toast.success('Sistem bileşeni eklendi.'); addSystemOpen.value=false; await load() } catch(e:any){ $toast.error(e?.data?.message||e?.message||'Sistem eklenemedi.') } finally { addSystemSaving.value=false } }
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />
    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />
      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1500px]">
          <section class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><h1 class="text-[30px] font-bold text-[#172033] dark:text-white">Yangın Tesisatı</h1><p class="text-sm font-semibold text-gray-500">Son Durum</p><p class="mt-0.5 text-xs text-gray-400">Tesisatın güncel durumu — son onaylanmış periyodik kontrol raporuna ve kayıtlı sistem bileşenlerine göre.</p></div>
            <div class="flex shrink-0 items-center gap-2"><button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" @click="openAddSystem"><Plus :size="15"/>Sistem Ekle</button><NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"><History :size="15"/>Rapor Geçmişi</NuxtLink><a v-if="report" :href="report.file_url" target="_blank" rel="noopener" class="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><FileText :size="15"/>Raporu Görüntüle</a></div>
          </section>

          <section v-if="report" class="mb-5 rounded-xl border border-red-100 bg-red-50/60 p-5 dark:border-red-500/20 dark:bg-red-500/10"><div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-full bg-[#d71920] text-white"><XCircle :size="22"/></span><div><p class="text-xs font-semibold text-[#d71920]">Genel Durum</p><p class="text-xl font-bold text-[#d71920]">{{ overallStatus }}</p><p class="text-xs text-red-600/80">Son periyodik kontrolde tesisat sonucu.</p></div></div><div class="flex flex-wrap items-center gap-6 lg:gap-8"><div class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#d71920]"><Calendar :size="16"/></span><div><p class="text-[11px] text-gray-500">Son Kontrol</p><p class="text-sm font-bold">{{ formatDate(report.report_date) }}</p><p class="text-[10px] text-gray-400">{{ formatWeekday(report.report_date) }}</p></div></div><div class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#d71920]"><CalendarClock :size="16"/></span><div><p class="text-[11px] text-gray-500">Geçerlilik Tarihi</p><p class="text-sm font-bold">{{ formatDate(report.next_control_date) }}</p><p v-if="daysRemaining(report.next_control_date)!==null" class="text-[10px] font-semibold text-emerald-600">Kalan süre: {{ daysRemaining(report.next_control_date) }} gün</p></div></div><div class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#d71920]"><FileText :size="16"/></span><div><p class="text-[11px] text-gray-500">Rapor No</p><p class="text-sm font-bold">{{ report.report_no || '—' }}</p><p v-if="report.inspection_company_name" class="text-[10px] text-gray-400">{{ report.inspection_company_name }}</p></div></div></div></div></section>
          <section v-else class="mb-5 rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400"><FileText :size="20"/></span><div><p class="text-sm font-bold">Henüz periyodik kontrol raporu bulunmuyor</p><p class="text-xs text-gray-400">İlk periyodik kontrol raporunu yüklediğinizde kontrol sonuçları burada gösterilecektir.</p></div></div><NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d71920] px-4 text-sm font-semibold text-white hover:bg-[#b9151b]"><FileText :size="15"/>Rapor Yükle</NuxtLink></div></section>

          <template v-if="systemSummaries.length">
            <section class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"><div v-for="card in [{v:overallSummary.systemCount,l:'Tespit Edilen Sistem',i:Layers,c:'bg-violet-50 text-violet-600'},{v:overallSummary.totalUnits,l:'Toplam Ekipman',i:Box,c:'bg-blue-50 text-blue-600'},{v:overallSummary.controlItemCount,l:'Kontrol Maddesi',i:ClipboardList,c:'bg-blue-50 text-blue-600'},{v:overallSummary.uygun,l:'Uygun',i:CheckCircle2,c:'bg-emerald-50 text-emerald-600'},{v:overallSummary.uygunDegil,l:'Uygun Değil',i:XCircle,c:'bg-red-50 text-[#d71920]'},{v:overallSummary.uygulanamiyor,l:'Uygulanması Yok',i:MinusCircle,c:'bg-gray-100 text-gray-500'}]" :key="card.l" class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><span :class="['mb-2 flex h-9 w-9 items-center justify-center rounded-lg',card.c]"><component :is="card.i" :size="16"/></span><p class="text-2xl font-bold leading-none">{{card.v}}</p><p class="mt-1 text-[11px] text-gray-400">{{card.l}}</p></div></section>

            <section class="grid gap-4 lg:grid-cols-3"><div class="space-y-4 lg:col-span-2"><div class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900"><div class="border-b border-[#f1f2f4] px-5 py-4"><p class="text-sm font-bold">Sistem Bazlı Durum</p><p class="text-[11px] text-gray-400">Son raporda tespit edilen yangın tesisatı bileşenlerinin durumu.</p></div><table class="w-full text-left text-sm"><thead><tr class="border-b border-[#f1f2f4] text-[11px] uppercase tracking-wide text-gray-400"><th class="px-5 py-2.5">Sistem</th><th class="px-3 py-2.5">Miktar / Bilgi</th><th class="px-3 py-2.5">Durum</th><th class="px-3 py-2.5">Kontrol Maddesi</th><th class="px-3 py-2.5">Uygunsuzluk</th><th/></tr></thead><tbody><tr v-for="s in systemSummaries" :key="s.category" class="border-b border-[#f1f2f4] last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5" @click="navigateTo(`/isg-portal/desktop/fire-suppression/systems/${s.category}`)"><td class="px-5 py-3"><div class="flex items-center gap-2.5"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-[#d71920]"><component :is="categoryIcon(s.category)" :size="15"/></span><span class="font-semibold">{{categoryLabel(s.category)}}</span></div></td><td class="px-3 py-3 text-xs text-gray-500">{{systemAmountLabel(s)}}<p v-if="s.unitsNonconform>0" class="font-semibold text-[#d71920]">{{s.unitsNonconform}} / {{s.unitCount}} uygunsuz</p></td><td class="px-3 py-3"><span v-if="s.status===null" class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">Rapor Yok</span><span v-else class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="resultMeta(s.status).cls">{{resultMeta(s.status).label}}</span></td><td class="px-3 py-3 font-semibold">{{s.controlItemCount||'—'}}</td><td class="px-3 py-3 font-semibold" :class="s.nonconformCount?'text-[#d71920]':'text-gray-400'">{{s.status===null?'—':s.nonconformCount}}</td><td class="px-3 py-3 text-right"><button type="button" class="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-[#d71920]" :disabled="deletingCategory===s.category" title="Sistemi sil" @click.stop="deleteSystemCategory(s)"><LoaderCircle v-if="deletingCategory===s.category" :size="15" class="animate-spin"/><Trash2 v-else :size="15"/></button><ChevronRight :size="16" class="ml-2 inline text-gray-300"/></td></tr></tbody></table></div>

              <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p class="mb-4 text-sm font-bold">Tesisat Bilgileri</p><dl class="grid gap-x-8 gap-y-3 sm:grid-cols-2"><div v-for="info in [{l:'Sistem Tipi',v:'—'},{l:'Yangın Pompası',v:systemSummaries.find(s=>s.category==='yangin_pompasi') ? systemAmountLabel(systemSummaries.find(s=>s.category==='yangin_pompasi')!) : '—'},{l:'Su Deposu Kapasitesi',v:'—'},{l:'Yangın Dolabı',v:systemSummaries.find(s=>s.category==='yangin_dolabi')?.unitCount ? `${systemSummaries.find(s=>s.category==='yangin_dolabi')!.unitCount} adet`:'—'},{l:'Sprinkler Tipi',v:'—'},{l:'Hidrant',v:systemSummaries.find(s=>s.category==='hidrant')?.unitCount ? `${systemSummaries.find(s=>s.category==='hidrant')!.unitCount} adet`:'—'},{l:'Bina Yüksekliği',v:'—'}]" :key="info.l" class="flex items-center justify-between border-b border-[#f5f6f8] pb-2"><dt class="text-xs text-gray-400">{{info.l}}</dt><dd class="text-xs font-semibold">{{info.v}}</dd></div></dl></div></div>

              <div class="space-y-4"><div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p class="text-sm font-bold">Uygunsuzlukların Sistemlere Göre Dağılımı</p><p class="mb-4 text-[11px] text-gray-400">Tespit edilen uygunsuz kontrol maddelerinin sistemlere göre dağılımı.</p><div class="space-y-2.5"><div v-for="s in systemSummaries" :key="`bar-${s.category}`" class="flex items-center gap-3"><p class="w-28 shrink-0 truncate text-xs text-gray-500">{{categoryLabel(s.category)}}</p><div class="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full bg-[#d71920]" :style="{width:`${(s.nonconformCount/maxNonconform)*100}%`}"/></div><p class="w-4 text-right text-xs font-semibold text-gray-500">{{s.nonconformCount}}</p></div></div></div><div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p class="mb-4 text-sm font-bold">Rapor Bilgileri</p><template v-if="report"><dl class="space-y-3"><div class="flex justify-between"><dt class="text-xs text-gray-400">Rapor No</dt><dd class="text-xs font-semibold">{{report.report_no||'—'}}</dd></div><div class="flex justify-between"><dt class="text-xs text-gray-400">Muayene Tarihi</dt><dd class="text-xs font-semibold">{{formatDate(report.report_date)}}</dd></div><div class="flex justify-between"><dt class="text-xs text-gray-400">Geçerlilik Tarihi</dt><dd class="text-xs font-semibold">{{formatDate(report.next_control_date)}}</dd></div></dl><a :href="report.file_url" target="_blank" rel="noopener" class="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"><FileText :size="15"/>Raporu Görüntüle</a></template><template v-else><p class="text-xs text-gray-400">Henüz rapor yüklenmedi.</p><NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#d71920] text-sm font-semibold text-white">Rapor Yükle</NuxtLink></template></div></div>
            </section>
          </template>
        </div>
      </main>
    </div>

    <div v-if="addSystemOpen" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30 p-4" @click.self="addSystemOpen=false"><div class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"><div class="mb-4 flex items-center justify-between"><p class="text-sm font-bold">Sistem Ekle</p><button type="button" @click="addSystemOpen=false"><X :size="16"/></button></div><div class="space-y-3"><select v-model="addSystemForm.category" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-800"><option v-for="c in categorySettings.enabledCategories" :key="c" :value="c">{{categoryLabel(c)}}</option></select><input v-model="addSystemForm.display_name" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Görünen ad (opsiyonel)"><input v-model="addSystemForm.code" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Kod (opsiyonel)"><input v-model="addSystemForm.location_note" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Konum notu (opsiyonel)"></div><div class="mt-5 flex gap-2"><button class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm" @click="addSystemOpen=false">Vazgeç</button><button class="flex-1 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-50" :disabled="addSystemSaving" @click="submitAddSystem">{{addSystemSaving?'Ekleniyor...':'Ekle'}}</button></div></div></div>
  </div>
  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">Yönlendiriliyor...</div>
</template>
