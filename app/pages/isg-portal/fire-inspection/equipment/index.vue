<script setup lang="ts">
import { ChevronLeft, Flame, MapPin, Search } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import type { LocationEmergencyEquipmentItem } from '~/types/location-emergency-equipment'

definePageMeta({ layout: 'fire-inspection' })

const fireInspection = useFireInspectionStore()
const items = ref<LocationEmergencyEquipmentItem[]>([])
const loading = ref(true)
const search = ref('')
const filter = ref<'all' | 'pending' | 'done'>('all')

onMounted(async () => {
  if (!fireInspection.ready) {
    await navigateTo(fireInspection.step2Path)
    return
  }
  loading.value = true
  try {
    const res = await locationEmergencyEquipmentApi.list(fireInspection.branchId!)
    items.value = res.data
  } finally {
    loading.value = false
  }
})

const pendingCount = computed(() => items.value.filter(i => !i.latest_inspection).length)
const doneCount = computed(() => items.value.filter(i => i.latest_inspection).length)

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return items.value.filter((i) => {
    const label = `${i.equipment_type?.name ?? ''} ${i.code ?? ''} ${i.location_note ?? ''}`.toLocaleLowerCase('tr-TR')
    const matchesSearch = !term || label.includes(term)
    const matchesFilter = filter.value === 'all' || (filter.value === 'pending' ? !i.latest_inspection : !!i.latest_inspection)
    return matchesSearch && matchesFilter
  })
})

const equipmentLabel = (item: LocationEmergencyEquipmentItem) => {
  const parts = [item.equipment_type?.name, item.equipment_type?.capacity_kg ? `${item.equipment_type.capacity_kg} kg` : null].filter(Boolean)
  return parts.join(' - ') || 'Ekipman'
}
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink to="/isg-portal/fire-inspection/menu" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Ekipman Denetimi</p>
    </header>

    <div class="p-4">
      <div class="mb-3 flex gap-2">
        <button type="button" class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold" :class="filter === 'all' ? 'bg-error-500 text-white' : 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="filter = 'all'">Tümü ({{ items.length }})</button>
        <button type="button" class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold" :class="filter === 'pending' ? 'bg-error-500 text-white' : 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="filter = 'pending'">Denetlenmeyen ({{ pendingCount }})</button>
        <button type="button" class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold" :class="filter === 'done' ? 'bg-error-500 text-white' : 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="filter = 'done'">Denetlenen ({{ doneCount }})</button>
      </div>

      <div class="relative mb-4">
        <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="search" placeholder="Ekipman ara..." class="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
      </div>

      <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else class="space-y-2.5">
        <NuxtLink v-for="item in filtered" :key="item.id" :to="`/isg-portal/fire-inspection/equipment/${item.id}`" class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/10"><Flame :size="17" /></span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ equipmentLabel(item) }}</span>
            <span class="flex items-center gap-1 truncate text-[11px] text-gray-400"><MapPin :size="10" />{{ item.code }} · {{ item.location_note || '—' }}</span>
          </span>
          <span class="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold" :class="item.latest_inspection ? (item.latest_inspection.overall_result === 'failed' ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600') : 'bg-warning-50 text-warning-600'">
            {{ item.latest_inspection ? (item.latest_inspection.overall_result === 'failed' ? 'Uygunsuz' : 'Denetlendi') : 'Bekliyor' }}
          </span>
        </NuxtLink>
        <p v-if="!filtered.length" class="py-12 text-center text-sm text-gray-400">Ekipman bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
