<script setup lang="ts">
import { CheckCircle2, ChevronDown, Search } from '@lucide/vue'
import { FIRE_SUPPRESSION_CATEGORY_LABELS } from '~/types/fire-suppression-inventory'
import { latestFireSuppressionAnalysisResult } from '~/api/fire-suppression-report'

export type MatchBucket = 'kesin' | 'belirsiz' | 'yeni'
export type MatchRow = {
  equipmentIndex: number
  code: string | null
  categoryLabel: string | null
  locationNote: string | null
  bucket: MatchBucket
}

const props = defineProps<{
  rows: MatchRow[]
  resolutionLabel?: (equipmentIndex: number) => string | null
  newItemApproved?: (equipmentIndex: number) => boolean
}>()

const emit = defineEmits<{ inspect: [number]; 'toggle-new': [number] }>()

const filter = ref<'all' | MatchBucket>(props.rows.some(r => r.bucket === 'belirsiz') ? 'belirsiz' : 'all')
const search = ref('')
const selectedSystems = ref<Set<string>>(new Set())
const expandedSystems = ref<Set<string>>(new Set())

const reportSystems = computed(() => latestFireSuppressionAnalysisResult.value?.systems ?? [])

const systemRows = computed(() => reportSystems.value.map((system, index) => ({
  key: `${system.category}-${system.name}-${index}`,
  name: system.name || 'İsimsiz Sistem',
  category: system.category,
  standardName: FIRE_SUPPRESSION_CATEGORY_LABELS[system.category] || system.category,
  componentCount: system.components?.length ?? 0,
  controlCount: system.control_count ?? 0,
  nonconformingCount: system.nonconforming_count ?? 0,
})))

const allSystemsSelected = computed(() => systemRows.value.length > 0 && systemRows.value.every(s => selectedSystems.value.has(s.key)))
const selectedSystemCount = computed(() => selectedSystems.value.size)
const toggleSystem = (key: string) => { const next = new Set(selectedSystems.value); if (next.has(key)) next.delete(key); else next.add(key); selectedSystems.value = next }
const toggleAllSystems = () => { selectedSystems.value = allSystemsSelected.value ? new Set() : new Set(systemRows.value.map(s => s.key)) }
const toggleSystemExpanded = (key: string) => { const next = new Set(expandedSystems.value); if (next.has(key)) next.delete(key); else next.add(key); expandedSystems.value = next }
const counts = computed(() => ({ all: props.rows.length, kesin: props.rows.filter(r => r.bucket === 'kesin').length, belirsiz: props.rows.filter(r => r.bucket === 'belirsiz').length, yeni: props.rows.filter(r => r.bucket === 'yeni').length }))
const filteredRows = computed(() => props.rows.filter((r) => { if (filter.value !== 'all' && r.bucket !== filter.value) return false; const q = search.value.trim().toLocaleLowerCase('tr-TR'); if (q && !`${r.code ?? ''} ${r.locationNote ?? ''} ${r.categoryLabel ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false; return true }))
const rowStatusMeta = (row: MatchRow) => { if (row.bucket === 'kesin') return { label: 'Kesin eşleşme', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }; if (row.bucket === 'yeni') { const approved = props.newItemApproved?.(row.equipmentIndex) ?? true; return approved ? { label: 'Yeni ekipman', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' } : { label: 'Hariç tutuldu', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' } }; const resolved = props.resolutionLabel?.(row.equipmentIndex); if (resolved) return { label: resolved, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }; return { label: 'İnceleme gerekli', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' } }
const systemDetailLabels = (system: any) => { const isCabinet = String(system.standardName || '').toLocaleLowerCase('tr-TR').includes('yangın dolabı'); return { componentLabel: isCabinet ? 'Dolap' : 'Bileşen', nonconformingLabel: isCabinet ? 'Uygunsuz ekipman' : 'Uygunsuzluk' } }
</script>

<template>
  <div class="space-y-5">
    <section v-if="systemRows.length" class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800"><div class="flex flex-wrap items-center justify-between gap-3"><div><div class="flex items-center gap-2"><h3 class="text-base font-semibold text-gray-900 dark:text-white">Sistemler</h3><span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-400">{{ systemRows.length }}</span></div><p class="mt-1 text-xs text-gray-500">Rapordaki ad korunur; eşleşme yazılımın ön tanımlı sistemi üzerinden yapılır.</p></div><button type="button" class="text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" @click="toggleAllSystems">{{ allSystemsSelected ? 'Seçimleri kaldır' : 'Tümünü seç' }}</button></div></div>
      <div v-if="selectedSystemCount" class="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-white/[0.02]"><span class="mr-1 text-xs font-semibold text-gray-600 dark:text-gray-300">{{ selectedSystemCount }} sistem seçildi</span><button type="button" class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900">Seçilenleri eşleştir</button><button type="button" class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">Yeni sistem olarak ekle</button><button type="button" class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">Hariç tut</button></div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="system in systemRows" :key="system.key" class="px-5 py-4"><div class="flex items-start gap-3"><input :checked="selectedSystems.has(system.key)" type="checkbox" class="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" @change="toggleSystem(system.key)"><div class="min-w-0 flex-1"><div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0"><p class="text-sm font-semibold text-gray-900 dark:text-white">{{ system.name }}</p><div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span class="rounded-md bg-gray-100 px-2 py-1 dark:bg-white/5">Rapor adı</span><span>{{ system.name }}</span></div><div class="mt-1 flex flex-wrap items-center gap-2 text-xs"><span class="rounded-md bg-purple-50 px-2 py-1 font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">Ön tanımlı sistem</span><span class="font-medium text-gray-700 dark:text-gray-300">{{ system.standardName }}</span></div></div><span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 :size="13" /> Eşleşmeye hazır</span></div><button type="button" class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" @click="toggleSystemExpanded(system.key)"><ChevronDown :size="14" :class="expandedSystems.has(system.key) ? 'rotate-180' : ''" class="transition-transform" />{{ expandedSystems.has(system.key) ? 'Detayı gizle' : 'Detayı göster' }}</button><div v-if="expandedSystems.has(system.key)" class="mt-3 grid grid-cols-3 gap-2"><div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"><p class="text-[11px] text-gray-400">{{ systemDetailLabels(system).componentLabel }}</p><p class="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-200">{{ system.componentCount }}{{ systemDetailLabels(system).componentLabel === 'Dolap' ? ' dolap' : '' }}</p></div><div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"><p class="text-[11px] text-gray-400">Kontrol</p><p class="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-200">{{ system.controlCount }}</p></div><div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"><p class="text-[11px] text-gray-400">{{ systemDetailLabels(system).nonconformingLabel }}</p><p class="mt-0.5 text-sm font-semibold" :class="system.nonconformingCount ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'">{{ system.nonconformingCount }}</p></div></div></div></div></div>
      </div>
    </section>
    <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 class="text-base font-semibold text-gray-900 dark:text-white">Bileşenler</h3><p class="mt-1 text-xs text-gray-500">Sadece karar gerektiren kayıtları inceleyin.</p></div><div class="relative w-full sm:w-64"><Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="search" type="text" placeholder="Bileşen ara..." class="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800"></div></div><div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><button v-for="item in [{ key: 'all', label: 'Tümü', value: counts.all }, { key: 'kesin', label: 'Kesin', value: counts.kesin }, { key: 'belirsiz', label: 'İnceleme', value: counts.belirsiz }, { key: 'yeni', label: 'Yeni', value: counts.yeni }]" :key="item.key" type="button" class="rounded-xl border px-3 py-2 text-left" :class="filter === item.key ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-white/[0.04]' : 'border-gray-200 dark:border-gray-800'" @click="filter = item.key as typeof filter"><p class="text-lg font-bold text-gray-900 dark:text-white">{{ item.value }}</p><p class="text-[11px] text-gray-500">{{ item.label }}</p></button></div><div class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800"><div v-for="row in filteredRows" :key="row.equipmentIndex" class="flex flex-wrap items-center gap-3 px-4 py-3"><div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ row.code || 'Kod belirtilmemiş' }}</p><p class="mt-0.5 text-xs text-gray-500">{{ row.categoryLabel || '—' }} · {{ row.locationNote || 'Konum belirtilmemiş' }}</p></div><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="rowStatusMeta(row).cls">{{ rowStatusMeta(row).label }}</span><button v-if="row.bucket === 'belirsiz'" type="button" class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="emit('inspect', row.equipmentIndex)">İncele</button><label v-else-if="row.bucket === 'yeni' && newItemApproved" class="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" :checked="newItemApproved(row.equipmentIndex)" @change="emit('toggle-new', row.equipmentIndex)"> Ekle</label></div><div v-if="!filteredRows.length" class="py-10 text-center text-xs text-gray-400">Gösterilecek bileşen yok.</div></div></section>
    <div class="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/5"><CheckCircle2 :size="17" class="mt-0.5 shrink-0 text-blue-600" /><div><p class="text-xs font-semibold text-blue-900 dark:text-blue-300">Rapor adı korunur</p><p class="mt-0.5 text-xs text-blue-700/80 dark:text-blue-300/70">Standartlaştırma yalnızca eşleştirme için kullanılır. Kaydedilen raporda AI'ın tespit ettiği sistem adı aynen saklanır.</p></div></div>
  </div>
</template>
