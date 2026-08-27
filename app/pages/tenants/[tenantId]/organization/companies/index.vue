<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import CompanyFilters from '~/components/companies/CompanyFilters.vue'
import CompanyPagination from '~/components/companies/CompanyPagination.vue'
import CompanyTable from '~/components/companies/CompanyTable.vue'
import CompanyEditDrawer from '~/components/companies/CompanyEditDrawer.vue'
import ConfirmationModal from '~/components/ConfirmationModal.vue'
import { companyApi } from '~/api/company'
import { useCompanyStore } from '~/stores/company'
import { useOrganizationStore } from '~/stores/organization'

definePageMeta({ layout: 'default' })
type CompanyStatus = 'active' | 'passive'
type Company = { id: number; name: string; shortName: string; group: string; brandCount: number; status: CompanyStatus; createdAt: string }
type CompanyForm = { name: string; company_type: 'individual' | 'corporate' }
const route = useRoute(); const tenantId = computed(() => String(route.params.tenantId ?? '')); const tenantIdNumber = computed(() => Number(tenantId.value))
const search = ref(''); const groupFilter = ref('all'); const statusFilter = ref('all'); const currentPage = ref(1); const perPage = ref(10)
const companyStore = useCompanyStore(); const organizationStore = useOrganizationStore(); const { companies: storeCompanies, loading, error, saving } = storeToRefs(companyStore); const { groups } = storeToRefs(organizationStore)
const companies = computed<Company[]>(() => storeCompanies.value); const groupOptions = computed(() => groups.value.map(group => group.name).filter(Boolean))
const filteredCompanies = computed(() => { const term = search.value.trim().toLocaleLowerCase('tr-TR'); return companies.value.filter(company => { const matchesSearch = !term || company.name.toLocaleLowerCase('tr-TR').includes(term) || company.shortName.toLocaleLowerCase('tr-TR').includes(term); return matchesSearch && (groupFilter.value === 'all' || company.group === groupFilter.value) && (statusFilter.value === 'all' || company.status === statusFilter.value) }) })
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCompanies.value.length / perPage.value))); const paginatedCompanies = computed(() => filteredCompanies.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value)); const visiblePages = computed(() => Array.from({ length: Math.min(5, totalPages.value) }, (_, index) => Math.min(Math.max(1, currentPage.value - 2) + index, totalPages.value)).filter((page, index, pages) => pages.indexOf(page) === index))
watch([search, groupFilter, statusFilter, perPage], () => { currentPage.value = 1 }); const resetFilters = () => { search.value = ''; groupFilter.value = 'all'; statusFilter.value = 'all' }; const goToCreate = () => navigateTo(`/tenants/${tenantId.value}/organization/companies/create`); const goToCompany = (id: number) => navigateTo(`/tenants/${tenantId.value}/organization/companies/${id}`)
const editOpen = ref(false); const editingId = ref<number | null>(null); const editForm = reactive<CompanyForm>({ name: '', company_type: 'corporate' }); const deleteOpen = ref(false); const deletingId = ref<number | null>(null)
const openEdit = async (id: number) => { const raw = await companyApi.get(id); editingId.value = id; editForm.name = raw.name; editForm.company_type = raw.company_type === 'individual' ? 'individual' : 'corporate'; editOpen.value = true }
const saveEdit = async (payload: CompanyForm) => { if (editingId.value === null) return; await companyStore.updateCompany(editingId.value, payload); editOpen.value = false }
const askDelete = (id: number) => { deletingId.value = id; deleteOpen.value = true }; const confirmDelete = async () => { if (deletingId.value === null) return; await companyStore.deleteCompany(deletingId.value); deleteOpen.value = false; deletingId.value = null }
onMounted(async () => { if (Number.isInteger(tenantIdNumber.value) && tenantIdNumber.value > 0) await Promise.all([companyStore.fetchCompanies(tenantIdNumber.value), organizationStore.fetchOrganizationsForTenant(tenantIdNumber.value)]) })
</script>
<template>
  <div class="font-outfit"><div class="mx-auto w-full max-w-[1400px]"><div class="mb-6"><h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Organizasyon Yönetimi</h1><p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Organizasyon yapınızı yönetin ve hiyerarşiyi görüntüleyin.</p></div><OrganizationTabs /><div class="mb-5 flex items-center justify-between gap-4"><p class="text-sm text-gray-500 dark:text-gray-400">Organizasyon yapınızda yer alan şirketleri görüntüleyin ve yönetin.</p><button type="button" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600" @click="goToCreate"><Plus :size="16" />Yeni Şirket</button></div><CompanyFilters v-model:search="search" v-model:group="groupFilter" v-model:status="statusFilter" :groups="groupOptions" @reset="resetFilters" /><section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><CompanyTable :companies="paginatedCompanies" :loading="loading" :error="error" @view="goToCompany" @edit="openEdit" @delete="askDelete" /><CompanyPagination v-model:page="currentPage" v-model:per-page="perPage" :total="filteredCompanies.length" :total-pages="totalPages" :visible-pages="visiblePages" /></section></div></div>
  <CompanyEditDrawer v-model:open="editOpen" :form="editForm" :saving="saving" @save="saveEdit" />
  <ConfirmationModal v-model:open="deleteOpen" title="Şirketi Sil" message="Bu şirketi silmek istediğinize emin misiniz? Bu işlem geri alınamaz." confirm-text="Sil" cancel-text="Vazgeç" @confirm="confirmDelete" />
</template>
