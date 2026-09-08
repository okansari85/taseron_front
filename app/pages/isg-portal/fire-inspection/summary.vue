<script setup lang="ts">
import { CheckCircle2, ChevronLeft, FileText } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import { fieldFindingApi } from '~/api/field-finding'

definePageMeta({ layout: 'fire-inspection' })

const fireInspection = useFireInspectionStore()
const loading = ref(true)

const equipmentTotal = ref(0)
const equipmentOk = ref(0)
const equipmentFailed = ref(0)
const findingsTotal = ref(0)
const findingsOpen = ref(0)
const findingsClosed = ref(0)

onMounted(async () => {
  if (!fireInspection.ready) {
    await navigateTo(fireInspection.step2Path)
    return
  }
  loading.value = true
  try {
    const [equipment, findings] = await Promise.all([
      locationEmergencyEquipmentApi.list(fireInspection.branchId!),
      fieldFindingApi.list(fireInspection.branchId!),
    ])
    equipmentTotal.value = equipment.data.length
    equipmentFailed.value = equipment.data.filter(e => e.latest_inspection?.overall_result === 'failed').length
    equipmentOk.value = equipment.data.filter(e => e.latest_inspection?.overall_result === 'passed').length
    findingsTotal.value = findings.data.length
    findingsOpen.value = findings.data.filter(f => f.status === 'open').length
    findingsClosed.value = findings.data.filter(f => f.status === 'closed').length
  } finally {
    loading.value = false
  }
})

const printReport = () => window.print()
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 print:hidden">
      <NuxtLink to="/isg-portal/fire-inspection/menu" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Denetim Özeti</p>
    </header>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
    <div v-else class="space-y-4 p-4">
      <div class="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-500 dark:bg-success-500/10"><CheckCircle2 :size="28" /></span>
        <p class="mt-3 text-sm font-semibold text-gray-900 dark:text-white/90">Denetim Tamamlandı</p>
        <p class="text-xs text-gray-400">{{ fireInspection.locationName }} / {{ fireInspection.branchName }}</p>
        <p class="text-[11px] text-gray-400">{{ new Date().toLocaleString('tr-TR') }}</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Ekipman Kontrolleri</p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div><p class="text-xl font-bold text-gray-900 dark:text-white/90">{{ equipmentTotal }}</p><p class="text-[11px] text-gray-400">Toplam</p></div>
          <div><p class="text-xl font-bold text-success-600">{{ equipmentOk }}</p><p class="text-[11px] text-gray-400">Uygun</p></div>
          <div><p class="text-xl font-bold text-error-600">{{ equipmentFailed }}</p><p class="text-[11px] text-gray-400">Uygun Değil</p></div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Saha Bulguları</p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div><p class="text-xl font-bold text-gray-900 dark:text-white/90">{{ findingsTotal }}</p><p class="text-[11px] text-gray-400">Toplam</p></div>
          <div><p class="text-xl font-bold text-warning-600">{{ findingsOpen }}</p><p class="text-[11px] text-gray-400">Açık</p></div>
          <div><p class="text-xl font-bold text-success-600">{{ findingsClosed }}</p><p class="text-[11px] text-gray-400">Kapalı</p></div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        Denetim tamamlandı. Tespit edilen uygunsuzluklar için aksiyon süreçleri başlatılmalıdır.
      </div>

      <div class="space-y-2 print:hidden">
        <button type="button" class="flex w-full items-center justify-center gap-2 rounded-xl border border-error-200 bg-white py-3 text-sm font-semibold text-error-600 dark:border-error-500/30 dark:bg-gray-900" @click="printReport"><FileText :size="15" />PDF Raporu Görüntüle</button>
        <NuxtLink to="/isg-portal/fire-inspection" class="block rounded-xl bg-gray-100 py-3 text-center text-sm font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">Ana Sayfaya Dön</NuxtLink>
      </div>
    </div>
  </div>
</template>
