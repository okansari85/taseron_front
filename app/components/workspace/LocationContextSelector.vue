<script setup lang="ts">
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-vue-next'
import { useWorkspaceContextStore } from '~/stores/workspaceContext'
import type { WorkspaceLocationOption } from '~/types/workspace-context'

const store = useWorkspaceContextStore()
const { locations, selectedLocationId, isLocationExpertOnly, locationExpertActiveLocation, openSelector } = storeToRefs(store)

const open = computed(() => openSelector.value === 'location')
const search = ref('')
const il = ref<string>('')
const bolge = ref<string>('')
const ilce = ref<string>('')

// İl/Bölge/İlçe seçenekleri sabit değil, seçili organizasyonun altındaki
// lokasyonlardan dinamik olarak çıkarılır. Bölge (region_group), bir ilin
// alt kırılımı olarak doldurulan manuel bir alan (ör. sadece İstanbul için
// Avrupa/Asya Yakası) — bu yüzden önce İl seçilir, Bölge ona göre daralır.
const ilOptions = computed(() => {
  const set = new Set(locations.value.map(item => item.city).filter((v): v is string => !!v))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr-TR'))
})
const bolgeOptions = computed(() => {
  const pool = il.value ? locations.value.filter(item => item.city === il.value) : locations.value
  const set = new Set(pool.map(item => item.region).filter((v): v is string => !!v))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr-TR'))
})
const ilceOptions = computed(() => {
  const pool = locations.value.filter(item =>
    (il.value ? item.city === il.value : true) && (bolge.value ? item.region === bolge.value : true)
  )
  const set = new Set(pool.map(item => item.district).filter((v): v is string => !!v))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr-TR'))
})

watch(il, () => { if (!bolgeOptions.value.includes(bolge.value)) bolge.value = '' })
watch(bolge, () => { if (!ilceOptions.value.includes(ilce.value)) ilce.value = '' })
watch(locations, () => { il.value = ''; bolge.value = ''; ilce.value = ''; search.value = '' })

const filteredLocations = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (term) {
    return locations.value.filter(item => `${item.name} ${item.city ?? ''} ${item.district ?? ''} ${item.region ?? ''}`.toLocaleLowerCase('tr-TR').includes(term))
  }
  return locations.value.filter(item =>
    (il.value ? item.city === il.value : true)
    && (bolge.value ? item.region === bolge.value : true)
    && (ilce.value ? item.district === ilce.value : true)
  )
})

const buttonLabel = computed(() => {
  if (isLocationExpertOnly.value) return locationExpertActiveLocation.value?.name ?? 'Lokasyon seç'
  return locations.value.find(item => item.id === selectedLocationId.value)?.name ?? 'Tüm Lokasyonlar'
})

const select = async (item: WorkspaceLocationOption) => {
  await store.selectLocation(item.id)
  store.closeSelector('location')
}

const clear = () => {
  store.clearLocation()
  store.closeSelector('location')
}

const root = ref<HTMLElement | null>(null)
const onClickOutside = (event: MouseEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) store.closeSelector('location')
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="relative flex items-center gap-1">
    <button
      type="button"
      class="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition"
      :class="isLocationExpertOnly ? 'cursor-default opacity-90' : 'hover:border-brand-200 dark:hover:border-brand-500/40'"
      :title="isLocationExpertOnly ? 'Atandığınız operasyonel alana bağlı lokasyon; seçim değiştirilemez.' : undefined"
      @click.stop="!isLocationExpertOnly && store.toggleSelector('location')"
    >
      <MapPin :size="16" class="shrink-0 text-brand-500" />
      <span class="max-w-[140px] truncate">{{ buttonLabel }}</span>
      <ChevronDown v-if="!isLocationExpertOnly" :size="14" class="shrink-0 text-gray-400" />
    </button>
    <button
      v-if="!isLocationExpertOnly && selectedLocationId !== null"
      type="button"
      title="Lokasyon filtresini temizle"
      class="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
      @click.stop="clear"
    >
      <X :size="14" />
    </button>

    <div v-if="open && !isLocationExpertOnly" class="absolute left-0 top-full z-[1000] mt-2 w-[380px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Lokasyon seç</p>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Seçilen organizasyona ait lokasyonlar.</p>
      </div>

      <div class="px-4 pt-3">
        <div class="relative">
          <Search :size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="search" placeholder="Lokasyon, il veya ilçe ara..." class="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 px-4 pt-3">
        <label class="block"><span class="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">İl</span>
          <div class="relative"><select v-model="il" class="h-9 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-2.5 pr-7 text-xs text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Tümü</option><option v-for="opt in ilOptions" :key="opt" :value="opt">{{ opt }}</option></select><ChevronDown :size="12" class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" /></div>
        </label>
        <label class="block"><span class="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Bölge</span>
          <div class="relative"><select v-model="bolge" class="h-9 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-2.5 pr-7 text-xs text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Tümü</option><option v-for="opt in bolgeOptions" :key="opt" :value="opt">{{ opt }}</option></select><ChevronDown :size="12" class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" /></div>
        </label>
        <label class="block"><span class="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">İlçe</span>
          <div class="relative"><select v-model="ilce" class="h-9 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-2.5 pr-7 text-xs text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Tümü</option><option v-for="opt in ilceOptions" :key="opt" :value="opt">{{ opt }}</option></select><ChevronDown :size="12" class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" /></div>
        </label>
      </div>

      <div class="mt-3 max-h-64 overflow-y-auto border-t border-gray-100 px-1.5 py-2 dark:border-gray-800">
        <button v-for="item in filteredLocations" :key="item.id" type="button" class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5" :class="item.id === selectedLocationId ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''" @click="select(item)">
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ item.name }}</span>
            <span v-if="item.city || item.district" class="block truncate text-[10px] text-gray-400">{{ [item.district, item.city].filter(Boolean).join(' / ') }}</span>
          </span>
          <Check v-if="item.id === selectedLocationId" :size="14" class="shrink-0 text-brand-500" />
        </button>
        <p v-if="!filteredLocations.length" class="px-3 py-6 text-center text-xs text-gray-400">Kayıt bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
