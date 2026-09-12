<script setup lang="ts">
// Rapor yükleme sihirbazının 3. adımı (sonuç listesi görünümü) — Matching
// Engine'in her ekipman satırı için döndürdüğü durumu (kesin/belirsiz/yeni)
// özetler. Üst bölümde yalnızca yangın tesisatı analizinden gelen sistem
// özeti gösterilir; eşleştirme satırları mevcut akışıyla aynı kalır.
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
  // "yeni" (envanterde bulunamadı) satırlar için: bu ekipmanın envantere
  // YENİ bir Sistem Bileşeni olarak eklenip eklenmeyeceği — rapor tek
  // başına envanter için kaynak olamaz, kullanıcının onayı gerekir.
  // Varsayılan onaylı (checkbox işaretli) gelir, kullanıcı isterse
  // işareti kaldırıp o ekipmanı envanterden hariç tutabilir. Prop
  // verilmezse "yeni" satırlar için onay kontrolü gösterilmez.
  newItemApproved?: (equipmentIndex: number) => boolean
}>()

const emit = defineEmits<{ inspect: [number]; 'toggle-new': [number] }>()

const filter = ref<'all' | MatchBucket>(props.rows.some(r => r.bucket === 'belirsiz') ? 'belirsiz' : 'all')
const search = ref('')
const route = useRoute()

const reportSystems = computed(() => {
  if (!route.path.includes('/fire-suppression/')) return []
  return latestFireSuppressionAnalysisResult.value?.systems ?? []
})

const counts = computed(() => ({
  all: props.rows.length,
  kesin: props.rows.filter(r => r.bucket === 'kesin').length,
  belirsiz: props.rows.filter(r => r.bucket === 'belirsiz').length,
  yeni: props.rows.filter(r => r.bucket === 'yeni').length,
}))

const filteredRows = computed(() => props.rows.filter((r) => {
  if (filter.value !== 'all' && r.bucket !== filter.value) return false
  if (search.value.trim()) {
    const q = search.value.trim().toLocaleLowerCase('tr-TR')
    if (!`${r.code ?? ''} ${r.locationNote ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false
  }
  return true
}))

const rowStatusMeta = (row: MatchRow) => {
  if (row.bucket === 'kesin') return { label: 'Kesin Eşleşen', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  if (row.bucket === 'yeni') {
    const approved = props.newItemApproved?.(row.equipmentIndex) ?? true
    return approved
      ? { label: 'Yeni Ekipman — Eklenecek', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
      : { label: 'Yeni Ekipman — Eklenmeyecek', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }
  }
  const resolved = props.resolutionLabel?.(row.equipmentIndex)
  if (resolved) return { label: resolved, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  return { label: 'Belirsiz Eşleşme', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' }
}
</script>

<template>
  <div>
    <div v-if="reportSystems.length" class="mb-5 rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-[#172033] dark:text-white">Tesisat Sistemleri</h3>
          <p class="mt-0.5 text-xs text-gray-400">Raporda tespit edilen sistemler ve fiziksel bileşenler</p>
        </div>
        <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500 dark:bg-white/5 dark:text-gray-400">{{ reportSystems.length }} sistem</span>
      </div>

      <div class="grid gap-2 md:grid-cols-2">
        <div v-for="system in reportSystems" :key="`${system.category}-${system.name}`" class="rounded-lg border border-[#eef0f2] px-3 py-2.5 dark:border-gray-800">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-[#172033] dark:text-white">{{ system.name || 'İsimsiz Sistem' }}</p>
              <p class="mt-0.5 text-xs text-gray-400">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[system.category] || system.category }}</p>
            </div>
            <span class="shrink-0 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">{{ system.components.length }} bileşen</span>
          </div>
          <div v-if="system.category !== 'yangin_dolabi'" class="mt-2 flex gap-3 text-[11px] text-gray-400">
            <span>Kontrol: {{ system.control_count }}</span>
            <span>Uygunsuz: {{ system.nonconforming_count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button type="button" class="rounded-xl border p-3 text-left transition" :class="filter === 'all' ? 'border-[#d71920] bg-red-50/40 dark:bg-red-500/5' : 'border-[#e7e9ed] dark:border-gray-800'" @click="filter = 'all'">
        <p class="text-2xl font-bold text-[#172033] dark:text-white">{{ counts.all }}</p>
        <p class="text-xs text-gray-400">Tümü</p>
      </button>
      <button type="button" class="rounded-xl border p-3 text-left transition" :class="filter === 'kesin' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-[#e7e9ed] dark:border-gray-800'" @click="filter = 'kesin'">
        <p class="text-2xl font-bold text-emerald-600">{{ counts.kesin }}</p>
        <p class="text-xs text-gray-400">Kesin Eşleşen</p>
      </button>
      <button type="button" class="rounded-xl border p-3 text-left transition" :class="filter === 'belirsiz' ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-[#e7e9ed] dark:border-gray-800'" @click="filter = 'belirsiz'">
        <p class="text-2xl font-bold text-amber-600">{{ counts.belirsiz }}</p>
        <p class="text-xs text-gray-400">Belirsiz Eşleşen</p>
      </button>
      <button type="button" class="rounded-xl border p-3 text-left transition" :class="filter === 'yeni' ? 'border-[#d71920] bg-red-50/40 dark:bg-red-500/5' : 'border-[#e7e9ed] dark:border-gray-800'" @click="filter = 'yeni'">
        <p class="text-2xl font-bold text-[#172033] dark:text-white">{{ counts.yeni }}</p>
        <p class="text-xs text-gray-400">Yeni Ekipman</p>
      </button>
    </div>

    <input v-model="search" type="text" placeholder="Ekipman ara..." class="mb-3 h-10 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">

    <div class="overflow-hidden rounded-xl border border-[#e7e9ed] dark:border-gray-800">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-[#f1f2f4] text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
            <th class="px-3 py-2.5">Rapor Bilgisi</th>
            <th class="px-3 py-2.5">Kategori</th>
            <th class="px-3 py-2.5">Konum</th>
            <th class="px-3 py-2.5">Eşleşme Durumu</th>
            <th class="px-3 py-2.5 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.equipmentIndex" class="border-b border-[#f1f2f4] last:border-0 dark:border-gray-800">
            <td class="px-3 py-2.5 font-semibold text-[#172033] dark:text-white">{{ row.code || '—' }}</td>
            <td class="px-3 py-2.5 text-gray-600 dark:text-gray-300">{{ row.categoryLabel || '—' }}</td>
            <td class="px-3 py-2.5 text-gray-600 dark:text-gray-300">{{ row.locationNote || '—' }}</td>
            <td class="px-3 py-2.5"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="rowStatusMeta(row).cls">{{ rowStatusMeta(row).label }}</span></td>
            <td class="px-3 py-2.5 text-right">
              <button v-if="row.bucket === 'belirsiz'" type="button" class="rounded-lg border border-[#dfe3e8] px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="emit('inspect', row.equipmentIndex)">İncele</button>
              <label v-else-if="row.bucket === 'yeni' && newItemApproved" class="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  class="h-3.5 w-3.5 rounded border-gray-300 text-[#d71920] focus:ring-[#d71920]"
                  :checked="newItemApproved(row.equipmentIndex)"
                  @change="emit('toggle-new', row.equipmentIndex)"
                >
                Envantere ekle
              </label>
              <span v-else class="text-xs text-gray-300">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filteredRows.length" class="py-8 text-center text-xs text-gray-400">Kayıt yok.</p>
    </div>
    <p class="mt-2 text-xs text-gray-400">Toplam {{ filteredRows.length }} kayıt</p>
  </div>
</template>
