<script setup lang="ts">
import { AlertTriangle, Building2, CheckCircle2, ChevronRight, Clock, Flame, RefreshCw, ShieldAlert, UserRound } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import { fieldFindingApi } from '~/api/field-finding'

definePageMeta({ layout: 'fire-inspection' })

const auth = useAuth()
const fireInspection = useFireInspectionStore()

const equipmentCount = ref(0)
const completedToday = ref(0)
const pendingCount = ref(0)
const nonComplianceCount = ref(0)
const findingsOpenCount = ref(0)
const lastInspectionDate = ref<string | null>(null)
const loading = ref(false)

const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })

const initials = computed(() => (auth.user.value?.name || 'K').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toLocaleUpperCase('tr-TR'))

const load = async () => {
  if (!fireInspection.branchId) return
  loading.value = true
  try {
    const equipment = await locationEmergencyEquipmentApi.list(fireInspection.branchId)
    equipmentCount.value = equipment.data.length
    const todayStr = new Date().toISOString().slice(0, 10)
    completedToday.value = equipment.data.filter(e => e.latest_inspection?.inspected_at?.slice(0, 10) === todayStr).length
    pendingCount.value = equipment.data.filter(e => !e.latest_inspection).length
    nonComplianceCount.value = equipment.data.filter(e => e.latest_inspection?.overall_result === 'failed').length
    const dates = equipment.data.map(e => e.latest_inspection?.inspected_at).filter(Boolean) as string[]
    lastInspectionDate.value = dates.length ? dates.sort().reverse()[0] : null

    const findings = await fieldFindingApi.list(fireInspection.branchId)
    findingsOpenCount.value = findings.data.filter(f => f.status === 'open').length
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => fireInspection.branchId, load)
</script>

<template>
  <div>
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-error-50 text-error-500 dark:bg-error-500/10"><Flame :size="18" /></span>
        <div>
          <p class="text-sm font-semibold text-gray-900 dark:text-white/90">İSG / Yangın Güvenlik</p>
          <p class="text-[11px] text-gray-400">Denetim Uygulaması</p>
        </div>
      </div>
      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">{{ initials }}</span>
    </header>

    <div class="space-y-4 p-4">
      <div class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5"><UserRound :size="18" /></span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-gray-900 dark:text-white/90">Merhaba {{ auth.user.value?.name || 'Kullanıcı' }}</p>
          <p class="text-xs text-gray-400">İSG Denetçisi</p>
        </div>
      </div>
      <p class="-mt-2 flex items-center gap-1.5 text-xs text-gray-400"><Clock :size="12" />{{ today }}</p>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/5"><Building2 :size="18" /></span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ fireInspection.locationName || 'Lokasyon seçilmedi' }}</p>
              <p class="truncate text-xs text-gray-400">{{ fireInspection.branchName || '—' }}</p>
              <p class="truncate text-[11px] text-gray-400">{{ fireInspection.branchLocationNote }}</p>
            </div>
          </div>
          <NuxtLink to="/isg-portal/fire-inspection/location" class="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">Değiştir</NuxtLink>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="text-[11px] text-gray-400">Bugünkü Denetimler</p>
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white/90">{{ equipmentCount }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="flex items-center gap-1 text-[11px] text-gray-400"><CheckCircle2 :size="12" class="text-success-500" />Tamamlanan</p>
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white/90">{{ completedToday }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="text-[11px] text-gray-400">Bekleyen</p>
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white/90">{{ pendingCount }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="flex items-center gap-1 text-[11px] text-gray-400"><AlertTriangle :size="12" class="text-warning-500" />Uygunsuzluk</p>
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white/90">{{ nonComplianceCount }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <NuxtLink to="/isg-portal/fire-inspection/equipment" class="rounded-2xl border border-error-100 bg-error-50/60 p-4 dark:border-error-500/20 dark:bg-error-500/5">
          <Flame :size="20" class="text-error-500" />
          <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white/90">Ekipman Denetimi</p>
          <p class="text-xs text-gray-500">{{ equipmentCount }} ekipman</p>
          <span class="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-error-500 px-3 py-2 text-xs font-semibold text-white">Denetime Başla</span>
        </NuxtLink>
        <NuxtLink to="/isg-portal/fire-inspection/findings" class="rounded-2xl border border-warning-100 bg-warning-50/60 p-4 dark:border-warning-500/20 dark:bg-warning-500/5">
          <ShieldAlert :size="20" class="text-warning-500" />
          <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white/90">Saha Bulguları</p>
          <p class="text-xs text-gray-500">{{ findingsOpenCount }} bulgu</p>
          <span class="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-warning-300 bg-white px-3 py-2 text-xs font-semibold text-warning-600 dark:bg-gray-900">Bulguları Gör</span>
        </NuxtLink>
      </div>

      <NuxtLink to="/isg-portal/fire-inspection/summary" class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 text-sm dark:border-gray-800 dark:bg-gray-900">
        <span class="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Clock :size="14" />Son Denetim {{ lastInspectionDate?.slice(0, 10)?.split('-').reverse().join('.') || '—' }}</span>
        <span class="flex items-center gap-1 text-brand-600">Detay <ChevronRight :size="14" /></span>
      </NuxtLink>

      <div class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        <span>Senkronizasyon Son: {{ new Date().toLocaleString('tr-TR') }}</span>
        <button type="button" class="flex items-center gap-1 text-brand-600" @click="load"><RefreshCw :size="13" />Şimdi Eşitle</button>
      </div>
    </div>
  </div>
</template>
