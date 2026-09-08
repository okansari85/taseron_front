<script setup lang="ts">
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, Clock, FileText, Flame } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import { fieldFindingApi } from '~/api/field-finding'

definePageMeta({ layout: 'fire-inspection' })

const fireInspection = useFireInspectionStore()
const equipmentTotal = ref(0)
const equipmentDone = ref(0)
const equipmentPending = ref(0)
const findingsTotal = ref(0)
const findingsHighSeverity = ref(0)
const findingsOpen = ref(0)
const offlineMode = ref(false)

onMounted(async () => {
  if (!fireInspection.ready) {
    await navigateTo(fireInspection.step2Path)
    return
  }
  const [equipment, findings] = await Promise.all([
    locationEmergencyEquipmentApi.list(fireInspection.branchId!),
    fieldFindingApi.list(fireInspection.branchId!),
  ])
  equipmentTotal.value = equipment.data.length
  equipmentDone.value = equipment.data.filter(e => e.latest_inspection).length
  equipmentPending.value = equipment.data.length - equipmentDone.value
  findingsTotal.value = findings.data.length
  findingsHighSeverity.value = findings.data.filter(f => f.severity === 'yuksek' || f.severity === 'kritik').length
  findingsOpen.value = findings.data.filter(f => f.status === 'open').length
})
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink :to="fireInspection.step2Path" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <div>
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Yangın Denetimi</p>
        <p class="text-[11px] text-gray-400">{{ fireInspection.locationName }} / {{ fireInspection.branchName }}</p>
      </div>
    </header>

    <div class="space-y-4 p-4">
      <div class="flex h-28 items-center justify-center rounded-2xl bg-gray-200 text-gray-400 dark:bg-white/5"><Building2 :size="28" /></div>

      <NuxtLink to="/isg-portal/fire-inspection/equipment" class="block rounded-2xl border border-error-100 bg-error-50/60 p-4 dark:border-error-500/20 dark:bg-error-500/5">
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white/90"><Flame :size="16" class="text-error-500" />Ekipman Denetimi</span>
          <ChevronRight :size="16" class="text-gray-300" />
        </div>
        <p class="mt-1 text-xs text-gray-500">{{ equipmentTotal }} ekipman</p>
        <p class="mt-1 flex items-center gap-1 text-xs text-success-600"><span class="h-1.5 w-1.5 rounded-full bg-success-500" />{{ equipmentDone }} tamamlandı · {{ equipmentPending }} bekliyor</p>
      </NuxtLink>

      <NuxtLink to="/isg-portal/fire-inspection/findings" class="block rounded-2xl border border-warning-100 bg-warning-50/60 p-4 dark:border-warning-500/20 dark:bg-warning-500/5">
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white/90"><AlertTriangle :size="16" class="text-warning-500" />Saha Bulguları</span>
          <ChevronRight :size="16" class="text-gray-300" />
        </div>
        <p class="mt-1 text-xs text-gray-500">{{ findingsTotal }} bulgu</p>
        <p v-if="findingsHighSeverity" class="mt-1 flex items-center gap-1 text-xs text-warning-600"><AlertTriangle :size="11" />yüksek önem · {{ findingsOpen }} açık</p>
      </NuxtLink>

      <NuxtLink to="/isg-portal/fire-inspection/summary" class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 text-sm dark:border-gray-800 dark:bg-gray-900">
        <span class="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Clock :size="15" />Denetim Geçmişi</span>
        <ChevronRight :size="15" class="text-gray-300" />
      </NuxtLink>
      <NuxtLink to="/isg-portal/fire-inspection/summary" class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 text-sm dark:border-gray-800 dark:bg-gray-900">
        <span class="flex items-center gap-2 text-gray-700 dark:text-gray-300"><FileText :size="15" />Raporlar</span>
        <ChevronRight :size="15" class="text-gray-300" />
      </NuxtLink>

      <div class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200">Offline Mod</p>
          <p class="text-[11px] text-gray-400">İnternet olmadan denetim yapabilirsiniz.</p>
        </div>
        <button type="button" role="switch" :aria-checked="offlineMode" class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition" :class="offlineMode ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'" @click="offlineMode = !offlineMode">
          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="offlineMode ? 'translate-x-6' : 'translate-x-1'" />
        </button>
      </div>
    </div>
  </div>
</template>
