<script setup lang="ts">
import { Building2, ChevronLeft, ChevronRight, Search } from 'lucide-vue-next'
import { locationApi, type LocationBusinessEntity } from '~/api/location'
import { useFireInspectionStore } from '~/stores/fireInspection'

definePageMeta({ layout: 'fire-inspection' })

const fireInspection = useFireInspectionStore()
const branches = ref<LocationBusinessEntity[]>([])
const loading = ref(true)
const search = ref('')

onMounted(async () => {
  if (!fireInspection.locationId) {
    await navigateTo('/isg-portal/fire-inspection/location')
    return
  }
  await fireInspection.loadLocationViewMode()
  if (fireInspection.locationViewMode === 'location') {
    await navigateTo('/isg-portal/fire-inspection/operational-area')
    return
  }
  loading.value = true
  try {
    const all = await locationApi.businessEntities(fireInspection.locationId)
    // Taşeron (contractor) kayıtları şube değildir, listeye dahil edilmez —
    // aynı filtre LocationCompaniesTab.vue'daki gibi sadece 'company' alır.
    branches.value = all.filter(b => b.type === 'company')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return branches.value
  return branches.value.filter(b => branchLabel(b).toLocaleLowerCase('tr-TR').includes(term))
})

// Şube etiketi olarak marka adı gösterilir (Burger King), yoksa şirket adı.
const branchBrand = (b: LocationBusinessEntity) => b.pivot?.brands?.[0] ?? null
const branchLabel = (b: LocationBusinessEntity) => branchBrand(b)?.name || b.company?.name || b.name
const branchNote = (b: LocationBusinessEntity) => b.pivot?.address

const select = (b: LocationBusinessEntity) => {
  fireInspection.setBranch(b.pivot?.id ?? b.id, branchLabel(b), branchNote(b), branchBrand(b)?.logo_url)
  navigateTo('/isg-portal/fire-inspection/menu')
}
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink to="/isg-portal/fire-inspection/location" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Şube Seç</p>
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
        <input v-model="search" type="search" placeholder="Şube ara..." class="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
      </div>

      <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else class="space-y-2.5">
        <button v-for="b in filtered" :key="b.pivot?.id ?? b.id" type="button" class="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left dark:border-gray-800 dark:bg-gray-900" @click="select(b)">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white dark:border-gray-700">
            <img v-if="branchBrand(b)?.logo_url" :src="branchBrand(b)!.logo_url!" :alt="branchLabel(b)" class="h-full w-full object-contain" />
            <span v-else class="text-xs font-semibold text-brand-600">{{ branchLabel(b).charAt(0) }}</span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ branchLabel(b) }}</span>
            <span v-if="branchNote(b)" class="block truncate text-xs text-gray-400">{{ branchNote(b) }}</span>
          </span>
          <ChevronRight :size="16" class="shrink-0 text-gray-300" />
        </button>
        <p v-if="!filtered.length" class="py-12 text-center text-sm text-gray-400">Şube bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
