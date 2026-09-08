<script setup lang="ts">
import { ChevronLeft, Plus } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { fieldFindingApi } from '~/api/field-finding'
import type { FieldFindingRecord } from '~/types/field-finding'

definePageMeta({ layout: 'fire-inspection' })

const fireInspection = useFireInspectionStore()
const findings = ref<FieldFindingRecord[]>([])
const loading = ref(true)
const statusFilter = ref<'all' | 'open' | 'closed'>('all')

const load = async () => {
  if (!fireInspection.branchId) return
  loading.value = true
  try {
    const res = await fieldFindingApi.list(fireInspection.branchId)
    findings.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!fireInspection.ready) {
    await navigateTo(fireInspection.step2Path)
    return
  }
  await load()
})

const categoryLabels: Record<string, string> = {
  yangin_guvenligi: 'Yangın Güvenliği',
  acil_cikis: 'Acil Çıkış',
  yangin_kapisi: 'Yangın Kapısı',
  kacis_yolu: 'Kaçış Yolu',
  diger: 'Diğer',
}
const severityLabels: Record<string, string> = { dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek', kritik: 'Kritik' }
const severityClass: Record<string, string> = {
  dusuk: 'bg-gray-100 text-gray-600',
  orta: 'bg-warning-50 text-warning-600',
  yuksek: 'bg-error-50 text-error-600',
  kritik: 'bg-error-100 text-error-700',
}

const openCount = computed(() => findings.value.filter(f => f.status === 'open').length)
const closedCount = computed(() => findings.value.filter(f => f.status === 'closed').length)
const filtered = computed(() => statusFilter.value === 'all' ? findings.value : findings.value.filter(f => f.status === statusFilter.value))

const toggleStatus = async (finding: FieldFindingRecord) => {
  const next = finding.status === 'open' ? 'closed' : 'open'
  await fieldFindingApi.update(finding.id, { status: next })
  await load()
}
</script>

<template>
  <div>
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-3">
        <NuxtLink to="/isg-portal/fire-inspection/menu" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
        <div>
          <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Saha Bulguları</p>
          <p class="text-[11px] text-gray-400">{{ fireInspection.locationName }} / {{ fireInspection.branchName }}</p>
        </div>
      </div>
      <NuxtLink to="/isg-portal/fire-inspection/findings/new" class="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"><Plus :size="13" />Yeni Bulgu</NuxtLink>
    </header>

    <div class="p-4">
      <div class="mb-4 flex gap-2">
        <button type="button" class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold" :class="statusFilter === 'all' ? 'bg-error-500 text-white' : 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="statusFilter = 'all'">Tümü ({{ findings.length }})</button>
        <button type="button" class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold" :class="statusFilter === 'open' ? 'bg-error-500 text-white' : 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="statusFilter = 'open'">Açık ({{ openCount }})</button>
        <button type="button" class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold" :class="statusFilter === 'closed' ? 'bg-error-500 text-white' : 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="statusFilter = 'closed'">Kapalı ({{ closedCount }})</button>
      </div>

      <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else class="space-y-2.5">
        <div v-for="f in filtered" :key="f.id" class="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
          <span class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
            <img v-if="f.photos[0]" :src="f.photos[0].photo_url" alt="Bulgu fotoğrafı" class="h-full w-full object-cover" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p class="truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ categoryLabels[f.category] }}</p>
              <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="severityClass[f.severity]">{{ severityLabels[f.severity] }}</span>
            </div>
            <p v-if="f.location_note" class="truncate text-xs text-gray-400">{{ f.location_note }}</p>
            <p v-if="f.description" class="mt-0.5 line-clamp-2 text-xs text-gray-500">{{ f.description }}</p>
            <div class="mt-1.5 flex items-center justify-between">
              <span class="text-[10px] text-gray-400">{{ new Date(f.created_at).toLocaleDateString('tr-TR') }}</span>
              <button type="button" class="text-[10px] font-semibold" :class="f.status === 'open' ? 'text-error-600' : 'text-success-600'" @click="toggleStatus(f)">{{ f.status === 'open' ? 'Açık · Kapat' : 'Kapalı · Aç' }}</button>
            </div>
          </div>
        </div>
        <p v-if="!filtered.length" class="py-12 text-center text-sm text-gray-400">Bulgu yok.</p>
      </div>
    </div>
  </div>
</template>
