<script setup lang="ts">
import {
  Calendar,
  ChevronRight,
  FileText,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  X,
} from '@lucide/vue'
import { fireSuppressionReportApi } from '~/api/fire-suppression-report'
import { fireSuppressionInventoryApi } from '~/api/fire-suppression-inventory'
import {
  FIRE_SUPPRESSION_CATEGORIES,
  FIRE_SUPPRESSION_CATEGORY_LABELS,
  type FireSuppressionCategory,
  type FireSuppressionInventoryItem,
} from '~/types/fire-suppression-inventory'
import type { FireSuppressionFindingScope, FireSuppressionReport, FireSuppressionReportFindingInput } from '~/types/fire-suppression-report'
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

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

const resultMeta = (status?: string | null) => status === 'uygun'
  ? { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  : status === 'uygun_degil'
    ? { label: 'Uygun Değil', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' }
    : { label: 'Belirtilmedi', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }

// --- Yükleme paneli ---
const drawerOpen = ref(false)
const saving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

type FindingForm = FireSuppressionReportFindingInput

const emptyFinding = (): FindingForm => ({ category: null, control_item: '', description: '', scope: 'unknown', area_note: '', affected_item_ids: [] })

const form = ref({
  report_date: '',
  next_control_date: '',
  covered_categories: [] as FireSuppressionCategory[],
  overall_result: '' as '' | 'uygun' | 'uygun_degil',
  notes: '',
  covered_inventory_item_ids: [] as number[],
  findings: [] as FindingForm[],
})

const openUpload = () => {
  selectedFile.value = null
  form.value = {
    report_date: new Date().toISOString().slice(0, 10),
    next_control_date: '',
    covered_categories: [],
    overall_result: '',
    notes: '',
    covered_inventory_item_ids: [],
    findings: [],
  }
  drawerOpen.value = true
}

const closeDrawer = () => { drawerOpen.value = false }

const onFileChange = (e: Event) => {
  selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

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

const submit = async () => {
  if (!context.branchId || !selectedFile.value || saving.value) return
  saving.value = true
  try {
    await fireSuppressionReportApi.create(context.branchId, {
      report_date: form.value.report_date,
      next_control_date: form.value.next_control_date || null,
      covered_categories: form.value.covered_categories,
      overall_result: form.value.overall_result || null,
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
    })
    $toast.success('Rapor yüklendi.')
    drawerOpen.value = false
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Rapor yüklenemedi.')
  } finally {
    saving.value = false
  }
}

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

const scopeOptions: { value: FireSuppressionFindingScope; label: string }[] = [
  { value: 'all', label: 'Tüm Ekipmanlara Uygula' },
  { value: 'specific', label: 'Ekipman Seç' },
  { value: 'area', label: 'Alan Belirt' },
  { value: 'unknown', label: 'Belirsiz Olarak Kaydet' },
]
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1500px]">
          <FireSuppressionTabs active="reports" />

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

    <!-- Rapor yükleme paneli -->
    <div v-if="drawerOpen" class="fixed inset-0 z-[10000] flex justify-end bg-black/30" @click.self="closeDrawer">
      <div class="flex h-full w-full max-w-lg flex-col bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p class="text-sm font-bold text-[#172033] dark:text-white">Rapor Yükle</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeDrawer"><X :size="16" /></button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <!-- 1. Rapor Bilgileri -->
          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">1. Rapor Bilgileri</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Rapor Tarihi</label>
                <input v-model="form.report_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Sonraki Kontrol</label>
                <input v-model="form.next_control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              </div>
            </div>
            <div class="mt-3">
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

          <!-- 2. PDF Yükleme -->
          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">2. PDF Yükleme</p>
            <input ref="fileInput" type="file" accept="application/pdf" class="hidden" @change="onFileChange">
            <button type="button" class="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#dfe3e8] px-4 py-3.5 text-left text-sm font-medium text-gray-600 hover:border-[#d71920]/40 dark:border-gray-700 dark:text-gray-300" @click="fileInput?.click()">
              <Upload :size="17" class="text-[#d71920]" />
              {{ selectedFile ? selectedFile.name : 'PDF Seç' }}
            </button>
          </div>

          <!-- 3. Uygunsuzluklar -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-wide text-gray-400">3. Uygunsuzluklar (Opsiyonel)</p>
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

          <!-- 4. Envanter Eşleştirme -->
          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">4. Bu Raporda Kontrol Edilen Ekipmanlar</p>
            <div class="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-[#e7e9ed] p-3 dark:border-gray-800">
              <label v-for="item in inventoryItems" :key="item.id" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <input type="checkbox" :checked="form.covered_inventory_item_ids.includes(item.id)" @change="toggleCoveredItem(item.id)">
                {{ item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }} <span class="text-gray-400">({{ FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }})</span>
              </label>
              <p v-if="!inventoryItems.length" class="text-[11px] text-gray-400">Bu şubede envanter kaydı yok.</p>
            </div>
            <p class="mt-1.5 text-[11px] text-gray-400">Seçilen ekipmanların son/sonraki kontrol tarihleri bu rapordan güncellenir.</p>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Notlar</label>
            <textarea v-model="form.notes" rows="2" class="w-full rounded-lg border border-[#dfe3e8] p-2.5 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800" />
          </div>
        </div>

        <div class="flex gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="saving" @click="closeDrawer">Vazgeç</button>
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="saving || !selectedFile || !form.report_date" @click="submit">
            <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
            Raporu Kaydet
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
