<script setup lang="ts">
import { Building2, Check, ChevronDown, Search } from 'lucide-vue-next'
import { useWorkspaceContextStore } from '~/stores/workspaceContext'
import type { WorkspaceOrganizationOption, WorkspaceOrganizationType } from '~/types/workspace-context'

type OrgTab = 'organizations' | 'companies' | 'brands'

const store = useWorkspaceContextStore()
const { organizations, selectedOrganizationId, openSelector } = storeToRefs(store)

const open = computed(() => openSelector.value === 'organization')
const search = ref('')

const typesForTab: Record<OrgTab, WorkspaceOrganizationType[]> = {
  organizations: ['holding', 'group'],
  companies: ['company'],
  brands: ['brand'],
}
const tabLabels: Record<OrgTab, string> = {
  organizations: 'Organizasyonlar',
  companies: 'Şirketler',
  brands: 'Markalar',
}

// Kullanıcının ağacında hiç şirket/marka düğümü yoksa o sekme hiç gösterilmez.
const availableTabs = computed<OrgTab[]>(() => {
  const tabs: OrgTab[] = []
  for (const tab of ['organizations', 'companies', 'brands'] as OrgTab[]) {
    if (organizations.value.some(item => typesForTab[tab].includes(item.type))) tabs.push(tab)
  }
  return tabs
})

const activeTab = ref<OrgTab>('organizations')
watch(availableTabs, (tabs) => {
  if (!tabs.includes(activeTab.value)) activeTab.value = tabs[0] ?? 'organizations'
}, { immediate: true })

const listForTab = computed<WorkspaceOrganizationOption[]>(() =>
  organizations.value.filter(item => typesForTab[activeTab.value].includes(item.type))
)

const filteredList = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return listForTab.value
  return listForTab.value.filter(item => item.name.toLocaleLowerCase('tr-TR').includes(term))
})

const activeOrgName = computed(() => organizations.value.find(item => item.id === selectedOrganizationId.value)?.name ?? 'Organizasyon seç')

const select = async (item: WorkspaceOrganizationOption) => {
  await store.selectOrganization(item.id, item.type === 'brand' ? 'brand' : 'organization')
  store.closeSelector('organization')
}

const root = ref<HTMLElement | null>(null)
const onClickOutside = (event: MouseEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) store.closeSelector('organization')
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-500/40"
      @click.stop="store.toggleSelector('organization')"
    >
      <Building2 :size="16" class="shrink-0 text-brand-500" />
      <span class="max-w-[140px] truncate">{{ activeOrgName }}</span>
      <ChevronDown :size="14" class="shrink-0 text-gray-400" />
    </button>

    <div v-if="open" class="absolute left-0 top-full z-[1000] mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Organizasyon seç</p>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Çalışmak istediğiniz organizasyonu seçin.</p>
      </div>

      <div class="px-3 pt-3">
        <div class="relative">
          <Search :size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="search" placeholder="Organizasyon, şirket veya marka ara..." class="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" />
        </div>
      </div>

      <div v-if="availableTabs.length > 1" class="flex gap-1 px-3 pt-3">
        <button
          v-for="tab in availableTabs"
          :key="tab"
          type="button"
          class="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition"
          :class="activeTab === tab ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'"
          @click="activeTab = tab"
        >{{ tabLabels[tab] }}</button>
      </div>

      <div class="mt-2 max-h-72 overflow-y-auto p-1.5">
        <button
          v-for="item in filteredList"
          :key="item.id"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
          :class="item.id === selectedOrganizationId ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''"
          @click="select(item)"
        >
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Building2 :size="13" /></span>
          <span class="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ item.name }}</span>
          <Check v-if="item.id === selectedOrganizationId" :size="14" class="shrink-0 text-brand-500" />
        </button>
        <p v-if="!filteredList.length" class="px-3 py-6 text-center text-xs text-gray-400">Kayıt bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
