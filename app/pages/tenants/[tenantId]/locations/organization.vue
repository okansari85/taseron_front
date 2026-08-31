<script setup lang="ts">
import { Check, ChevronDown, Search, Unlink } from 'lucide-vue-next'
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
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const detachOpen = ref(false)

const visibleLocations = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return locations.value.filter(location => !term || location.name.toLocaleLowerCase('tr-TR').includes(term))
})

const getOrganization = (location: LocationApiItem) => {
  if (location.organization) return location.organization
  return location.organizations?.[0] ?? null
}

const organizationLabel = (organization: Organization) => {
  const chain: string[] = []
  let current: Organization | null | undefined = organization
  const byId = new Map(organizations.value.map(item => [item.id, item]))
  while (current) {
    chain.unshift(current.name)
    current = current.parent_id ? byId.get(current.parent_id) : null
  }
  return chain.join(' / ')
}

const toggleLocation = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}

const sync = async () => {
  if (!selectedOrganizationId.value || selectedIds.value.length === 0) return
  saving.value = true
  error.value = ''
  try {
    await locationApi.syncOrganization(selectedOrganizationId.value, selectedIds.value)
    const organization = organizations.value.find(item => item.id === selectedOrganizationId.value)
    locations.value = locations.value.map(location =>
      selectedIds.value.includes(location.id)
        ? {
            ...location,
            organization: organization ? { id: organization.id, name: organization.name } : null,
            organizations: organization ? [{ id: organization.id, name: organization.name }] : [],
          }
        : location,
    )
    selectedIds.value = []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Lokasyon eşleştirme başarısız.'
  } finally {
    saving.value = false
  }
}

const askDetach = () => {
  if (selectedIds.value.length === 0) return
  detachOpen.value = true
}

const detachSelected = async () => {
  saving.value = true
  error.value = ''
  try {
    const selectedLocations = locations.value.filter(location => selectedIds.value.includes(location.id))
    const assignments = selectedLocations
      .map(location => ({ location, organization: getOrganization(location) }))
      .filter(item => item.organization !== null)

    await Promise.all(
      assignments.map(item =>
        locationApi.detachOrganization(item.organization!.id, item.location.id),
      ),
    )

    locations.value = locations.value.map(location =>
      selectedIds.value.includes(location.id)
        ? { ...location, organization: null, organizations: [] }
        : location,
    )
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
    const [locationResponse, organizationResponse] = await Promise.all([
      locationApi.list(),
      organizationApi.listForTenant(tenantId.value),
    ])
    locations.value = locationResponse
    organizations.value = organizationResponse
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
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Lokasyonları toplu olarak bir organizasyon düğümüne bağlayın.</p>
      </div>

      <OrganizationTabs :tabs="[
        { label: 'Lokasyonlar', to: `/tenants/${tenantId}/locations`, exact: true },
        { label: 'Lokasyon Organizasyon Eşleştirmesi', to: `/tenants/${tenantId}/locations/organization`, exact: true },
      ]" />

      <div class="mb-5 flex items-center justify-between gap-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">Lokasyonları seçin, ardından bağlanacağı organizasyon düğümünü belirleyin.</p>
        <div class="flex shrink-0 items-center gap-2">
          <button
            v-if="selectedIds.length > 0"
            type="button"
            :disabled="saving"
            class="inline-flex h-10 items-center gap-2 rounded-lg border border-error-200 bg-white px-4 text-sm font-semibold text-error-600 shadow-theme-xs transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500/30 dark:bg-white/[0.03] dark:text-error-400 dark:hover:bg-error-500/10"
            @click="askDetach"
          >
            <Unlink :size="16" /> Eşleştirmeyi Kaldır
          </button>
          <button type="button" :disabled="saving || selectedIds.length === 0 || !selectedOrganizationId" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" @click="sync">
            <Check :size="16" /> {{ saving ? 'İşleniyor...' : 'Eşleştir' }}
          </button>
        </div>
      </div>

      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.35fr)_minmax(280px,1fr)]">
          <div class="relative">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="search" type="search" placeholder="Lokasyon ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </div>
          <div class="relative">
            <select v-model="selectedOrganizationId" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option :value="null">Organizasyon düğümü seçin</option>
              <option v-for="organization in organizations" :key="organization.id" :value="organization.id">{{ organizationLabel(organization) }}</option>
            </select>
            <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div v-if="error" class="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">{{ error }}</div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
              <tr>
                <th class="w-12 px-4 py-3"></th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Lokasyon</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Mevcut Organizasyon</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-if="loading">
                <td colspan="3" class="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Lokasyonlar yükleniyor...</td>
              </tr>
              <tr v-for="location in visibleLocations" v-else :key="location.id" class="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                <td class="px-4 py-3">
                  <input type="checkbox" :checked="selectedIds.includes(location.id)" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" @change="toggleLocation(location.id)" />
                </td>
                <td class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{{ location.name }}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ getOrganization(location)?.name || 'Eşleştirilmemiş' }}</td>
              </tr>
              <tr v-if="!loading && visibleLocations.length === 0">
                <td colspan="3" class="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Lokasyon bulunamadı.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>

  <ConfirmationModal
    v-model:open="detachOpen"
    title="Lokasyon Eşleştirmesini Kaldır"
    :message="`${selectedIds.length} lokasyonun organizasyon eşleştirmesi kaldırılacak. Bu işlemi onaylıyor musunuz?`"
    confirm-text="Eşleştirmeyi Kaldır"
    cancel-text="Vazgeç"
    @confirm="detachSelected"
  />
</template>
