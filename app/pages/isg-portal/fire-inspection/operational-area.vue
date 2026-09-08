<script setup lang="ts">
import { Building2, ChevronLeft, ChevronRight, MapPinned, Search } from 'lucide-vue-next'
import { locationApi, type LocationBusinessEntity } from '~/api/location'
import { workspaceContextApi } from '~/api/workspace-context'
import type { WorkspaceOperationalAreaOption } from '~/types/workspace-context'
import { useFireInspectionStore } from '~/stores/fireInspection'

definePageMeta({ layout: 'fire-inspection' })

const { $toast } = useNuxtApp()
const fireInspection = useFireInspectionStore()
const areas = ref<WorkspaceOperationalAreaOption[]>([])
// Alan -> o alana bağlı LocationBusinessEntity eşlemesi (ekipman/denetim verisi hâlâ LBE seviyesinde tutuluyor).
const areaEntityMap = ref<Record<number, LocationBusinessEntity>>({})
const loading = ref(true)
const search = ref('')

onMounted(async () => {
  if (!fireInspection.locationId) {
    await navigateTo('/isg-portal/fire-inspection/location')
    return
  }
  loading.value = true
  try {
    const [areasRes, entities] = await Promise.all([
      workspaceContextApi.operationalAreas(fireInspection.locationId),
      locationApi.businessEntities(fireInspection.locationId),
    ])
    areas.value = areasRes.items
    const map: Record<number, LocationBusinessEntity> = {}
    // Taşeron kayıtları şube/alan değildir, eşlemeye dahil edilmez — branch.vue'daki aynı filtre.
    entities.filter(entity => entity.type === 'company').forEach((entity) => {
      const regionId = entity.pivot?.operational_region_id
      if (regionId) map[regionId] = entity
    })
    areaEntityMap.value = map
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return areas.value
  return areas.value.filter(a => a.name.toLocaleLowerCase('tr-TR').includes(term))
})

const select = (area: WorkspaceOperationalAreaOption) => {
  const entity = areaEntityMap.value[area.id]
  if (!entity) {
    $toast.error('Bu alana bağlı bir şube/işletme kaydı bulunamadı.')
    return
  }
  fireInspection.setBranch(entity.pivot?.id ?? entity.id, area.name, entity.pivot?.address, null)
  navigateTo('/isg-portal/fire-inspection/menu')
}
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink to="/isg-portal/fire-inspection/location" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Operasyonel Alan Seç</p>
    </header>

    <div class="p-4">
      <div class="mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
        <div class="flex min-w-0 items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
            <img v-if="fireInspection.locationImage" :src="fireInspection.locationImage" :alt="fireInspection.locationName" class="h-full w-full object-cover" />
            <Building2 v-else :size="18" class="text-gray-400" />
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ fireInspection.locationName }}</p>
            <p class="truncate text-xs text-gray-400">{{ [fireInspection.locationDistrict, fireInspection.locationCity].filter(Boolean).join(', ') }}</p>
          </div>
        </div>
        <NuxtLink to="/isg-portal/fire-inspection/location" class="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">Değiştir</NuxtLink>
      </div>

      <div class="relative mb-4">
        <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="search" placeholder="Alan ara..." class="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
      </div>

      <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else class="space-y-2.5">
        <button v-for="a in filtered" :key="a.id" type="button" class="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left dark:border-gray-800 dark:bg-gray-900" @click="select(a)">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-600 dark:border-gray-700">
            <MapPinned :size="16" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ a.name }}</span>
          </span>
          <ChevronRight :size="16" class="shrink-0 text-gray-300" />
        </button>
        <p v-if="!filtered.length" class="py-12 text-center text-sm text-gray-400">Operasyonel alan bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
