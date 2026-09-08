<script setup lang="ts">
import { CalendarClock, ClipboardList, Plus, UserRound } from '@lucide/vue'
import ContractorCreateDrawer from '~/components/ContractorCreateDrawer.vue'
import { workRequestApi } from '~/api/work-request'
import { useContractorStore } from '~/stores/contractor'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? '1'))
const contractorStore = useContractorStore()
const { contractors } = storeToRefs(contractorStore)

const temporaryContractors = computed(() => contractors.value.filter((x) => x.type === 'Geçici'))
const jobStats = ref<Record<number, { activeCount: number; lastDate: string | null }>>({})
const loading = ref(true)
const drawerOpen = ref(false)
const createError = ref('')

const formatDate = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const loadJobStats = async () => {
  const entries = await Promise.all(
    temporaryContractors.value.map(async (c) => {
      try {
        const { data } = await workRequestApi.list(c.id)
        const activeCount = data.filter((wr) => wr.status === 'pending' || wr.status === 'approved').length
        const dates = data
          .map((wr) => wr.proposed_date ?? wr.requested_date)
          .filter((d): d is string => Boolean(d))
          .sort()
        const lastDate = dates.length ? formatDate(dates[dates.length - 1]) : null
        return [c.id, { activeCount, lastDate }] as const
      } catch {
        return [c.id, { activeCount: 0, lastDate: null }] as const
      }
    }),
  )
  jobStats.value = Object.fromEntries(entries)
}

const load = async () => {
  loading.value = true
  try {
    await contractorStore.fetchContractors()
    await loadJobStats()
  } finally {
    loading.value = false
  }
}
onMounted(load)

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
    await loadJobStats()
  } catch (error) {
    createError.value = error instanceof Error ? error.message : 'Alt yüklenici oluşturulamadı.'
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1300px] space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-brand-500">Geçici Taşeron Havuzu</p>
        <h1 class="mt-1 text-2xl font-semibold">Geçici Taşeronlar</h1>
        <p class="mt-1 text-sm text-gray-500">Geçici taşeronlar kalıcı lokasyona bağlanmaz; iş talebi ve ziyaret üzerinden kullanılır.</p>
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
    <div class="rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/20 dark:bg-brand-500/10">
      <div class="flex gap-3">
        <ClipboardList class="mt-0.5 text-brand-500" :size="20" />
        <div>
          <h2 class="font-semibold">İş akışı</h2>
          <p class="mt-1 text-sm text-gray-600">Organizasyon iş talebi oluşturur → tarih planlanır → geçici taşeron onaylar → iş tamamlanır.</p>
        </div>
      </div>
    </div>
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 p-5 dark:border-gray-800"><h2 class="font-semibold">Geçici Taşeron Havuzu</h2></div>
      <div v-if="loading" class="p-5 text-sm text-gray-500">Yükleniyor...</div>
      <div v-else-if="!temporaryContractors.length" class="p-5 text-sm text-gray-500">Henüz geçici taşeron eklenmedi.</div>
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="c in temporaryContractors" :key="c.id" class="flex items-center justify-between p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5"><UserRound :size="18" /></div>
            <div>
              <NuxtLink :to="`/tenants/${tenantId}/contractors/${c.id}`" class="font-medium hover:underline">{{ c.name }}</NuxtLink>
              <p class="mt-1 text-xs text-gray-400">
                {{ jobStats[c.id]?.activeCount ? `${jobStats[c.id].activeCount} aktif iş` : 'Aktif iş yok' }}
                <template v-if="jobStats[c.id]?.lastDate"> · Son planlama {{ jobStats[c.id].lastDate }}</template>
              </p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
            ><CalendarClock :size="13" /> İş bazlı kullanım</span
          >
        </div>
      </div>
    </div>
    <ContractorCreateDrawer v-model="drawerOpen" :edit-data="null" default-type="Geçici" @save="saveContractor" />
  </div>
</template>
