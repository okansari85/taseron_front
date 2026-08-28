<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import BrandEditDrawer, { type BrandForm } from '~/components/brands/BrandEditDrawer.vue'
import BrandFilters from '~/components/brands/BrandFilters.vue'
import BrandTable from '~/components/brands/BrandTable.vue'
import CompanyPagination from '~/components/companies/CompanyPagination.vue'
import ConfirmationModal from '~/components/ConfirmationModal.vue'
import { useBrandStore } from '~/stores/brand'
import { useCompanyStore } from '~/stores/company'
import type { Brand } from '~/types/brand'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tenantId = computed(() => Number(route.params.tenantId ?? 0))
const brandStore = useBrandStore()
const companyStore = useCompanyStore()
const { brands, loading, error, saving } = storeToRefs(brandStore)
const { companies } = storeToRefs(companyStore)

const search = ref('')
const companyFilter = ref('all')
const groupFilter = ref('all')
const statusFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)
const editOpen = ref(false)
const editingId = ref<number | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<number | null>(null)
const form = reactive<BrandForm>({ name: '', shortName: '', companyId: null, description: '', isActive: true, logo: null, logoPreview: '' })

const companyOptions = computed(() => [...new Set(brands.value.map(brand => brand.company).filter(company => company !== '—'))])
const groupOptions = computed(() => [...new Set(brands.value.map(brand => brand.group).filter(group => group !== '—'))])
const editCompanies = computed(() => companies.value.map(company => ({ id: company.id, name: company.name, group: company.group })))
const filteredBrands = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return brands.value.filter(brand => {
    const matchesSearch = !term || brand.name.toLocaleLowerCase('tr-TR').includes(term) || brand.shortName.toLocaleLowerCase('tr-TR').includes(term)
    return matchesSearch && (companyFilter.value === 'all' || brand.company === companyFilter.value) && (groupFilter.value === 'all' || brand.group === groupFilter.value) && (statusFilter.value === 'all' || brand.status === statusFilter.value)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredBrands.value.length / perPage.value)))
const paginatedBrands = computed(() => filteredBrands.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value))
const visiblePages = computed(() => Array.from({ length: Math.min(5, totalPages.value) }, (_, index) => Math.min(Math.max(1, currentPage.value - 2) + index, totalPages.value)).filter((page, index, pages) => pages.indexOf(page) === index))

watch([search, companyFilter, groupFilter, statusFilter, perPage], () => { currentPage.value = 1 })
watch(totalPages, pages => { if (currentPage.value > pages) currentPage.value = pages })

const resetFilters = () => {
  search.value = ''
  companyFilter.value = 'all'
  groupFilter.value = 'all'
  statusFilter.value = 'all'
}
const goToCreate = () => navigateTo(`/tenants/${tenantId.value}/organization/brands/create`)
const goToBrand = (id: number) => navigateTo(`/tenants/${tenantId.value}/organization/brands/${id}`)
const openEdit = async (brand: Brand) => {
  editingId.value = brand.id
  form.name = brand.name
  form.shortName = brand.shortName
  form.companyId = brand.companyId
  form.description = brand.description
  form.isActive = brand.status === 'active'
  form.logo = null
  form.logoPreview = brand.logoUrl ?? ''

  await companyStore.fetchCompanies(tenantId.value)
  editOpen.value = true
}
const saveEdit = async (payload: BrandForm) => {
  if (editingId.value === null || payload.companyId === null) return
  await brandStore.updateBrand(editingId.value, { name: payload.name.trim(), shortName: payload.shortName.trim(), description: payload.description.trim(), isActive: payload.isActive, companyIds: [payload.companyId], logo: payload.logo })
  editOpen.value = false
}
const askDelete = (id: number) => {
  deletingId.value = id
  deleteOpen.value = true
}
const confirmDelete = async () => {
  if (deletingId.value === null) return
  await brandStore.deleteBrand(deletingId.value)
  deleteOpen.value = false
  deletingId.value = null
}

onMounted(async () => {
  if (!Number.isInteger(tenantId.value) || tenantId.value <= 0) return
  await brandStore.fetchBrands()
})
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-6"><h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Organizasyon Yönetimi</h1><p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Organizasyon yapınızı yönetin ve hiyerarşiyi görüntüleyin.</p></div>
      <OrganizationTabs />
      <div class="mb-5 flex items-center justify-between gap-4"><p class="text-sm text-gray-500 dark:text-gray-400">Şirketlerinize bağlı markaları görüntüleyin ve yönetin.</p><button type="button" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600" @click="goToCreate"><Plus :size="16" />Yeni Marka</button></div>
      <BrandFilters v-model:search="search" v-model:company="companyFilter" v-model:group="groupFilter" v-model:status="statusFilter" :companies="companyOptions" :groups="groupOptions" @reset="resetFilters" />
      <section class="overflow-visible rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <BrandTable :brands="paginatedBrands" :loading="loading" :error="error" @view="goToBrand" @edit="id => openEdit(brands.find(brand => brand.id === id)!)" @delete="askDelete" />
        <CompanyPagination v-model:page="currentPage" v-model:per-page="perPage" :total="filteredBrands.length" :total-pages="totalPages" :visible-pages="visiblePages" />
      </section>
    </div>
    <BrandEditDrawer v-model:open="editOpen" :form="form" :companies="editCompanies" :saving="saving" @save="saveEdit" />
    <ConfirmationModal v-model:open="deleteOpen" title="Markayı Sil" message="Bu markayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz." confirm-text="Sil" cancel-text="Vazgeç" @confirm="confirmDelete" />
  </div>
</template>
