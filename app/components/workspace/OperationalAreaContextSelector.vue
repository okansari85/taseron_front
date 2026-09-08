<script setup lang="ts">
import { Check, ChevronDown, Layers3, Search } from 'lucide-vue-next'
import { useWorkspaceContextStore } from '~/stores/workspaceContext'
import type { WorkspaceOperationalAreaOption } from '~/types/workspace-context'

const store = useWorkspaceContextStore()
const { operationalAreas, selectedOperationalAreaId, locationExpertLocked, openSelector } = storeToRefs(store)

const open = computed(() => openSelector.value === 'area')
const search = ref('')

const items = computed(() => operationalAreas.value.items)

const filteredItems = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return items.value
  return items.value.filter(item => item.name.toLocaleLowerCase('tr-TR').includes(term))
})

const buttonLabel = computed(() => items.value.find(item => item.id === selectedOperationalAreaId.value)?.name ?? 'Operasyonel alan seç')

const select = (item: WorkspaceOperationalAreaOption) => {
  store.selectOperationalArea(item.id)
  store.closeSelector('area')
}

const root = ref<HTMLElement | null>(null)
const onClickOutside = (event: MouseEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) store.closeSelector('area')
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition"
      :class="locationExpertLocked ? 'cursor-default opacity-90' : 'hover:border-brand-200 dark:hover:border-brand-500/40'"
      :title="locationExpertLocked ? 'Bu alana atandığınız için seçim değiştirilemez.' : undefined"
      @click.stop="!locationExpertLocked && store.toggleSelector('area')"
    >
      <Layers3 :size="16" class="shrink-0 text-brand-500" />
      <span class="max-w-[140px] truncate">{{ buttonLabel }}</span>
      <ChevronDown v-if="!locationExpertLocked" :size="14" class="shrink-0 text-gray-400" />
    </button>

    <div v-if="open && !locationExpertLocked" class="absolute left-0 top-full z-[1000] mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Operasyonel alan seç</p>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Seçilen lokasyona ait operasyonel alanlar.</p>
      </div>

      <div v-if="items.length > 6" class="px-3 pt-3">
        <div class="relative">
          <Search :size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="search" placeholder="Operasyonel alan ara..." class="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" />
        </div>
      </div>

      <div class="mt-2 max-h-72 overflow-y-auto p-1.5">
        <button v-for="item in filteredItems" :key="item.id" type="button" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5" :class="item.id === selectedOperationalAreaId ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''" @click="select(item)">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Layers3 :size="13" /></span>
          <span class="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ item.name }}</span>
          <Check v-if="item.id === selectedOperationalAreaId" :size="14" class="shrink-0 text-brand-500" />
        </button>
        <p v-if="!filteredItems.length" class="px-3 py-6 text-center text-xs text-gray-400">Kayıt bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
