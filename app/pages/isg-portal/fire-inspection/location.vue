<script setup lang="ts">
import { ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-vue-next'
import { locationApi, type LocationApiItem } from '~/api/location'
import { useFireInspectionStore } from '~/stores/fireInspection'

definePageMeta({ layout: 'fire-inspection' })

const fireInspection = useFireInspectionStore()
const auth = useAuth()

const locations = ref<LocationApiItem[]>([])
const loading = ref(true)
const search = ref('')

onMounted(async () => {
  loading.value = true
  try {
    locations.value = await locationApi.list(auth.user.value?.tenant_id ?? '')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return locations.value
  return locations.value.filter(l => `${l.name} ${l.city?.name ?? ''} ${l.district?.name ?? ''}`.toLocaleLowerCase('tr-TR').includes(term))
})

// Taşeron (contractor) kayıtları şube değildir, saymaya dahil edilmez —
// aynı filtre branch.vue'da da uygulanıyor.
const branchCount = (l: LocationApiItem) => (l.businessEntities ?? []).filter(b => b.type === 'company').length

const config = useRuntimeConfig()
const apiBaseUrl = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
const resolveImageUrl = (image?: string | null) => {
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image
  return `${apiBaseUrl}/storage/${String(image).replace(/^\/+/, '').replace(/^storage\//, '')}`
}

const select = async (l: LocationApiItem) => {
  fireInspection.setLocation(l.id, l.name, l.city?.name, l.district?.name, resolveImageUrl(l.image))
  await fireInspection.loadLocationViewMode()
  navigateTo(fireInspection.step2Path)
}
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink to="/isg-portal/fire-inspection" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Lokasyon Seç</p>
    </header>

    <div class="p-4">
      <div class="relative mb-4">
        <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="search" placeholder="Lokasyon ara..." class="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
      </div>

      <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else class="space-y-2.5">
        <button v-for="l in filtered" :key="l.id" type="button" class="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left dark:border-gray-800 dark:bg-gray-900" @click="select(l)">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
            <img v-if="l.image" :src="resolveImageUrl(l.image)" :alt="l.name" class="h-full w-full object-cover" />
            <MapPin v-else :size="18" class="text-gray-400" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ l.name }}</span>
            <span class="block truncate text-xs text-gray-400">{{ [l.district?.name, l.city?.name].filter(Boolean).join(', ') }}</span>
            <span class="block text-[11px] text-gray-400">{{ branchCount(l) }} şube</span>
          </span>
          <ChevronRight :size="16" class="shrink-0 text-gray-300" />
        </button>
        <p v-if="!filtered.length" class="py-12 text-center text-sm text-gray-400">Lokasyon bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
