<script setup lang="ts">
import { MapPin, Plus, UserRound } from '@lucide/vue'
import ContractorCreateDrawer from '~/components/ContractorCreateDrawer.vue'
import { contractorApi, type ContractorLocationItem } from '~/api/contractor'
import { useContractorStore } from '~/stores/contractor'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? '1'))
const contractorStore = useContractorStore()
const { contractors } = storeToRefs(contractorStore)

const permanentContractors = computed(() => contractors.value.filter((x) => x.type === 'Daimi'))
const locationCounts = ref<Record<number, number>>({})
const loading = ref(true)
const drawerOpen = ref(false)
const createError = ref('')

const loadLocationCounts = async () => {
  const entries = await Promise.all(
    permanentContractors.value.map(async (c) => {
      try {
        const locations: ContractorLocationItem[] = await contractorApi.locations(c.id)
        return [c.id, locations.length] as const
      } catch {
        return [c.id, 0] as const
      }
    }),
  )
  locationCounts.value = Object.fromEntries(entries)
}

const load = async () => {
  loading.value = true
  try {
    await contractorStore.fetchContractors()
    await loadLocationCounts()
  } finally {
    loading.value = false
  }
}
onMounted(load)

const assignedCount = computed(
  () => permanentContractors.value.filter((c) => (locationCounts.value[c.id] ?? 0) > 0).length,
)

const saveContractor = async (payload: {
  id?: number
  name: string
  shortName: string
  type: 'Daimi' | 'Geçici'
  status: 'active' | 'passive'
  logo: File | null
  logoPreview: string
}) => {
  createError.value = ''
  try {
    await contractorStore.createContractor({
      name: payload.name,
      shortName: payload.shortName,
      contractor_type: payload.type === 'Daimi' ? ('permanent' as const) : ('temporary' as const),
      status: payload.status,
      logo: payload.logo,
    })
    drawerOpen.value = false
    await loadLocationCounts()
  } catch (error) {
    createError.value = error instanceof Error ? error.message : 'Alt yüklenici oluşturulamadı.'
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1300px] space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-brand-500">Daimi Taşeron Havuzu</p>
        <h1 class="mt-1 text-2xl font-semibold">Daimi Taşeronlar</h1>
        <p class="mt-1 text-sm text-gray-500">Grup havuzundaki taşeronları yönetin ve doğrudan lokasyonlara atayın.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white"
        @click="drawerOpen = true"
      >
        <Plus :size="17" /> Taşeron Ekle
      </button>
    </div>
    <p v-if="createError" class="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-600">{{ createError }}</p>
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <p class="text-xs text-gray-400">Grup havuzu</p>
          <p class="mt-1 text-xl font-semibold">{{ permanentContractors.length }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400">Lokasyona atanmış</p>
          <p class="mt-1 text-xl font-semibold">{{ assignedCount }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400">Evrak uygunluğu</p>
          <p class="mt-1 text-xl font-semibold text-gray-400">—</p>
        </div>
      </div>
    </div>
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 p-5 dark:border-gray-800"><h2 class="font-semibold">Taşeronlar</h2></div>
      <div v-if="loading" class="p-5 text-sm text-gray-500">Yükleniyor...</div>
      <div v-else-if="!permanentContractors.length" class="p-5 text-sm text-gray-500">Henüz daimi taşeron eklenmedi.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[800px] text-left text-sm">
          <thead class="border-b border-gray-100 text-xs text-gray-400 dark:border-gray-800">
            <tr>
              <th class="px-5 py-4">Taşeron</th>
              <th>Lokasyon Ataması</th>
              <th>Personel</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in permanentContractors" :key="c.id" class="border-b border-gray-100 dark:border-gray-800">
              <td class="px-5 py-4">
                <NuxtLink :to="`/tenants/${tenantId}/contractors/${c.id}`" class="font-medium hover:underline">{{ c.name }}</NuxtLink>
                <p class="text-xs text-gray-400">{{ c.status === 'active' ? 'Kullanıcı hesabı aktif' : 'Pasif hesap' }}</p>
              </td>
              <td><span class="inline-flex items-center gap-1 text-gray-600"><MapPin :size="15" />{{ locationCounts[c.id] ?? 0 }} lokasyon</span></td>
              <td><span class="inline-flex items-center gap-1 text-gray-400"><UserRound :size="15" />—</span></td>
              <td>
                <span
                  class="rounded-full px-2.5 py-1 text-xs"
                  :class="c.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'"
                  >{{ c.status === 'active' ? 'Aktif' : 'Pasif' }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <ContractorCreateDrawer v-model="drawerOpen" :edit-data="null" default-type="Daimi" @save="saveContractor" />
  </div>
</template>
