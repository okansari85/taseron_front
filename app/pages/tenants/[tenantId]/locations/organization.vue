<script setup lang="ts">
import { Building2, Check, ChevronDown, ChevronRight, MapPin, Search, Unlink, Users } from 'lucide-vue-next'
import { locationApi, type LocationApiItem } from '~/api/location'
import { organizationApi } from '~/api/organization'
import type { Organization } from '~/types/organization'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tenantId = computed(() => Number(route.params.tenantId ?? 0))
const locations = ref<LocationApiItem[]>([])
const organizations = ref<Organization[]>([])
const selectedIds = ref<number[]>([])
const selectedOrganizationId = ref<number | null>(null)
const expandedIds = ref<number[]>([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const detachOpen = ref(false)

const organizationNodes = computed(() => organizations.value.filter(item => item.type !== 'location'))
const roots = computed(() => organizationNodes.value.filter(item => !item.parent_id))
const childrenOf = (parentId: number) => organizationNodes.value.filter(item => item.parent_id === parentId)
const selectedOrganization = computed(() => organizationNodes.value.find(item => item.id === selectedOrganizationId.value) ?? null)
const assignedCount = computed(() => locations.value.filter(location => {
  const org = (location as any).organization ?? location.organizations?.[0]
  return org?.id === selectedOrganizationId.value
}).length)
const visibleLocations = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return locations.value.filter(location => !term || `${location.name} ${location.city?.name ?? ''} ${location.district?.name ?? ''}`.toLocaleLowerCase('tr-TR').includes(term))
})

const getOrganization = (location: LocationApiItem) => (location as any).organization ?? location.organizations?.[0] ?? null
const isExpanded = (id: number) => expandedIds.value.includes(id)
const toggleExpanded = (id: number) => {
  expandedIds.value = isExpanded(id) ? expandedIds.value.filter(item => item !== id) : [...expandedIds.value, id]
}
const typeLabel = (type: string) => ({ holding: 'Holding', group: 'Grup', company: 'Şirket', brand: 'Marka' }[type] ?? 'Organizasyon')
const typeIconClass = (type: string) => ({ holding: 'bg-violet-50 text-violet-600', group: 'bg-blue-50 text-blue-600', company: 'bg-emerald-50 text-emerald-600', brand: 'bg-amber-50 text-amber-600' }[type] ?? 'bg-gray-50 text-gray-500')
const selectOrganization = (id: number) => {
  selectedOrganizationId.value = id
  selectedIds.value = locations.value.filter(location => getOrganization(location)?.id === id).map(location => location.id)
  search.value = ''
}
const toggleLocation = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter(item => item !== id) : [...selectedIds.value, id]
}
const allVisibleSelected = computed(() => visibleLocations.value.length > 0 && visibleLocations.value.every(location => selectedIds.value.includes(location.id)))
const toggleAllVisible = () => {
  if (allVisibleSelected.value) selectedIds.value = selectedIds.value.filter(id => !visibleLocations.value.some(location => location.id === id))
  else selectedIds.value = [...new Set([...selectedIds.value, ...visibleLocations.value.map(location => location.id)])]
}

const sync = async () => {
  if (!selectedOrganizationId.value || selectedIds.value.length === 0) return
  saving.value = true
  error.value = ''
  try {
    await locationApi.syncOrganization(selectedOrganizationId.value, selectedIds.value)
    const organization = organizations.value.find(item => item.id === selectedOrganizationId.value)
    locations.value = locations.value.map(location => selectedIds.value.includes(location.id)
      ? { ...location, organization: organization ? { id: organization.id, name: organization.name } : null, organizations: organization ? [{ id: organization.id, name: organization.name }] : [] } as LocationApiItem
      : location)
    selectedIds.value = []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Lokasyon eşleştirme başarısız.'
  } finally {
    saving.value = false
  }
}

const askDetach = () => { if (selectedIds.value.length > 0) detachOpen.value = true }
const detachSelected = async () => {
  saving.value = true
  error.value = ''
  try {
    const selectedLocations = locations.value.filter(location => selectedIds.value.includes(location.id))
    await Promise.all(selectedLocations.map(location => {
      const organization = getOrganization(location)
      return organization ? locationApi.detachOrganization(organization.id, location.id) : Promise.resolve()
    }))
    locations.value = locations.value.map(location => selectedIds.value.includes(location.id) ? { ...location, organization: null, organizations: [] } as LocationApiItem : location)
    selectedIds.value = []
    detachOpen.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Lokasyon eşleştirmesi kaldırılamadı.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!tenantId.value) return
  loading.value = true
  error.value = ''
  try {
    const [locationResponse, organizationResponse] = await Promise.all([locationApi.list(tenantId.value), organizationApi.listForTenant(tenantId.value)])
    locations.value = Array.isArray(locationResponse) ? locationResponse : ((locationResponse as any)?.data ?? [])
    organizations.value = organizationResponse
    if (roots.value.length) expandedIds.value = roots.value.map(item => item.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Veriler yüklenemedi.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Lokasyon Organizasyon Eşleştirmesi</h1>
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Organizasyon ağacından hedefi seçin, sağ taraftan lokasyonları toplu olarak eşleştirin.</p>
      </div>

      <OrganizationTabs :tabs="[
        { label: 'Lokasyonlar', to: `/tenants/${tenantId}/locations`, exact: true },
        { label: 'Lokasyon Organizasyon Eşleştirmesi', to: `/tenants/${tenantId}/locations/organization`, exact: true },
      ]" />

      <div v-if="error" class="mb-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">{{ error }}</div>

      <section class="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside class="border-b border-gray-200 bg-gray-50/50 dark:border-gray-800 lg:border-b-0 lg:border-r dark:bg-white/[0.015]">
          <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500"><Building2 :size="19" /></div>
              <div><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Organizasyon Yapısı</h2><p class="mt-0.5 text-xs text-gray-500">Hedef düğümü seçin</p></div>
            </div>
          </div>
          <div class="max-h-[560px] overflow-y-auto p-3">
            <div v-if="loading" class="space-y-2 p-2"><div v-for="i in 7" :key="i" class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></div>
            <div v-else-if="roots.length === 0" class="px-4 py-12 text-center text-sm text-gray-500">Organizasyon bulunamadı.</div>
            <template v-else>
              <div v-for="root in roots" :key="root.id" class="mb-1">
                <button type="button" class="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-white dark:hover:bg-gray-900" :class="selectedOrganizationId === root.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : ''" @click="selectOrganization(root.id)">
                  <span v-if="childrenOf(root.id).length" class="flex h-6 w-6 shrink-0 items-center justify-center text-gray-400" @click.stop="toggleExpanded(root.id)"><ChevronDown v-if="isExpanded(root.id)" :size="15"/><ChevronRight v-else :size="15"/></span><span v-else class="w-6" />
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="typeIconClass(root.type)"><Building2 :size="15" /></span>
                  <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">{{ root.name }}</span><span class="block text-[11px] text-gray-400">{{ typeLabel(root.type) }}</span></span>
                </button>
                <div v-if="isExpanded(root.id)" class="ml-5 border-l border-gray-200 pl-2 dark:border-gray-700">
                  <template v-for="child in childrenOf(root.id)" :key="child.id">
                    <button type="button" class="mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-white dark:hover:bg-gray-900" :class="selectedOrganizationId === child.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : ''" @click="selectOrganization(child.id)">
                      <span v-if="childrenOf(child.id).length" class="flex h-6 w-6 shrink-0 items-center justify-center text-gray-400" @click.stop="toggleExpanded(child.id)"><ChevronDown v-if="isExpanded(child.id)" :size="15"/><ChevronRight v-else :size="15"/></span><span v-else class="w-6" />
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="typeIconClass(child.type)"><Building2 :size="15" /></span>
                      <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ child.name }}</span><span class="block text-[11px] text-gray-400">{{ typeLabel(child.type) }}</span></span>
                    </button>
                    <div v-if="isExpanded(child.id)" class="ml-5 border-l border-gray-200 pl-2 dark:border-gray-700">
                      <button v-for="leaf in childrenOf(child.id)" :key="leaf.id" type="button" class="mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-white dark:hover:bg-gray-900" :class="selectedOrganizationId === leaf.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : ''" @click="selectOrganization(leaf.id)">
                        <span class="w-6" /><span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="typeIconClass(leaf.type)"><Building2 :size="15" /></span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ leaf.name }}</span><span class="block text-[11px] text-gray-400">{{ typeLabel(leaf.type) }}</span></span>
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </aside>

        <div class="min-w-0 bg-white dark:bg-gray-950/20">
          <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500"><MapPin :size="19" /></div>
                <div class="min-w-0"><div class="flex items-center gap-2"><h2 class="truncate text-base font-semibold text-gray-900 dark:text-white/90">{{ selectedOrganization?.name || 'Organizasyon seçin' }}</h2><span v-if="selectedOrganization" class="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">{{ typeLabel(selectedOrganization.type) }}</span></div><p class="mt-1 text-xs text-gray-500">{{ selectedOrganization ? `${assignedCount} lokasyon eşleştirilmiş` : 'Soldaki ağaçtan bir organizasyon düğümü seçin.' }}</p></div>
              </div>
              <div class="flex items-center gap-2">
                <button v-if="selectedIds.length" type="button" :disabled="saving" class="inline-flex h-10 items-center gap-2 rounded-lg border border-error-200 px-3 text-sm font-semibold text-error-600 hover:bg-error-50 disabled:opacity-50" @click="askDetach"><Unlink :size="15"/> Eşleştirmeyi Kaldır</button>
                <button type="button" :disabled="saving || !selectedOrganizationId || selectedIds.length === 0" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" @click="sync"><Check :size="16"/>{{ saving ? 'Kaydediliyor...' : `Eşleştir${selectedIds.length ? ` (${selectedIds.length})` : ''}` }}</button>
              </div>
            </div>
          </div>

          <div class="border-b border-gray-200 p-4 dark:border-gray-800">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="relative w-full md:max-w-md"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input v-model="search" type="search" placeholder="Lokasyon ara..." :disabled="!selectedOrganizationId" class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:disabled:bg-gray-900/50"/></div>
              <div class="flex items-center gap-3 text-sm text-gray-500"><span>{{ visibleLocations.length }} lokasyon</span><span class="h-4 w-px bg-gray-200 dark:bg-gray-700"/><button type="button" :disabled="!selectedOrganizationId || visibleLocations.length === 0" class="font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-gray-400" @click="toggleAllVisible">{{ allVisibleSelected ? 'Seçimleri Kaldır' : 'Tümünü Seç' }}</button></div>
            </div>
          </div>

          <div class="max-h-[470px] overflow-y-auto">
            <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 6" :key="i" class="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /></div>
            <div v-else-if="!selectedOrganizationId" class="flex min-h-[400px] flex-col items-center justify-center px-6 text-center"><div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"><Users :size="28" /></div><h3 class="mt-4 text-base font-semibold text-gray-900 dark:text-white/90">Organizasyon seçin</h3><p class="mt-1 max-w-sm text-sm text-gray-500">Lokasyonları görmek ve toplu eşleştirme yapmak için soldaki organizasyon ağacından bir düğüm seçin.</p></div>
            <div v-else-if="visibleLocations.length === 0" class="flex min-h-[300px] items-center justify-center text-sm text-gray-500">Aramanızla eşleşen lokasyon bulunamadı.</div>
            <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <label v-for="location in visibleLocations" :key="location.id" class="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition hover:bg-gray-50 dark:hover:bg-white/[0.02]" :class="selectedIds.includes(location.id) ? 'bg-brand-50/50 dark:bg-brand-500/[0.04]' : ''">
                <input type="checkbox" :checked="selectedIds.includes(location.id)" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" @change="toggleLocation(location.id)" />
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800"><MapPin :size="18" /></div>
                <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ location.name }}</p><p class="mt-0.5 truncate text-xs text-gray-500">{{ location.district?.name || '' }} / {{ location.city?.name || '' }}<span v-if="location.address"> · {{ location.address }}</span></p></div>
                <span v-if="getOrganization(location)?.id === selectedOrganizationId" class="hidden shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600 sm:inline-flex">Mevcut eşleşme</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-5 py-3.5 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.015]"><span>{{ selectedIds.length }} lokasyon seçildi</span><span v-if="selectedOrganization">Hedef: <strong class="text-gray-700 dark:text-gray-300">{{ selectedOrganization.name }}</strong></span></div>
        </div>
      </section>
    </div>
  </div>

  <ConfirmationModal v-model:open="detachOpen" title="Lokasyon Eşleştirmesini Kaldır" :message="`${selectedIds.length} lokasyonun organizasyon eşleştirmesi kaldırılacak. Bu işlemi onaylıyor musunuz?`" confirm-text="Eşleştirmeyi Kaldır" cancel-text="Vazgeç" @confirm="detachSelected" />
</template>
