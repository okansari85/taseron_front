<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useCompanyStore } from '~/stores/company'

definePageMeta({ layout: 'default' })

type CompanyStatus = 'active' | 'passive'
type Company = { id: number; name: string; shortName: string; group: string; brandCount: number; status: CompanyStatus; createdAt: string }

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))
const tenantIdNumber = computed(() => Number(tenantId.value))
const search = ref('')
const groupFilter = ref('all')
const statusFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)
const companyStore = useCompanyStore()
const { companies: storeCompanies, loading, error } = storeToRefs(companyStore)
const companies = computed<Company[]>(() => storeCompanies.value)
const groupOptions = computed(() => [...new Set(companies.value.map(company => company.group))].filter(Boolean))
const filteredCompanies = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return companies.value.filter(company => {
    const matchesSearch = !term || company.name.toLocaleLowerCase('tr-TR').includes(term) || company.shortName.toLocaleLowerCase('tr-TR').includes(term)
    return matchesSearch && (groupFilter.value === 'all' || company.group === groupFilter.value) && (statusFilter.value === 'all' || company.status === statusFilter.value)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCompanies.value.length / perPage.value)))
const paginatedCompanies = computed(() => filteredCompanies.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value))
const visiblePages = computed(() => Array.from({ length: Math.min(5, totalPages.value) }, (_, index) => Math.min(Math.max(1, currentPage.value - 2) + index, totalPages.value)).filter((page, index, pages) => pages.indexOf(page) === index))
watch([search, groupFilter, statusFilter, perPage], () => { currentPage.value = 1 })
const resetFilters = () => { search.value = ''; groupFilter.value = 'all'; statusFilter.value = 'all' }
const goToCreate = () => navigateTo(`/tenants/${tenantId.value}/organization/companies/create`)
const goToCompany = (id: number) => navigateTo(`/tenants/${tenantId.value}/organization/companies/${id}`)

onMounted(() => {
  if (Number.isInteger(tenantIdNumber.value) && tenantIdNumber.value > 0) companyStore.fetchCompanies(tenantIdNumber.value)
})
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-6"><h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Organizasyon Yönetimi</h1><p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Organizasyon yapınızı yönetin ve hiyerarşiyi görüntüleyin.</p></div>
      <OrganizationTabs />
      <div class="mb-5 flex items-center justify-between gap-4"><p class="text-sm text-gray-500 dark:text-gray-400">Organizasyon yapınızda yer alan şirketleri görüntüleyin ve yönetin.</p><button type="button" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600" @click="goToCreate"><Plus :size="16" />Yeni Şirket</button></div>
      <CompanyFilters v-model:search="search" v-model:group="groupFilter" v-model:status="statusFilter" :groups="groupOptions" @reset="resetFilters" />
      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><CompanyTable :companies="paginatedCompanies" :loading="loading" :error="error" @view="goToCompany" /><CompanyPagination v-model:page="currentPage" v-model:per-page="perPage" :total="filteredCompanies.length" :total-pages="totalPages" :visible-pages="visiblePages" /></section>
    </div>
  </div>
</template>
