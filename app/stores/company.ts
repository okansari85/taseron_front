import { defineStore } from 'pinia'
import type { Company, CompanyApiRecord } from '~/types/company'
import { companyApi } from '~/api/company'

const normalizeCompany = (item: CompanyApiRecord): Company => ({
  id: item.id,
  name: item.name,
  shortName: item.name
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-'),
  group: '—',
  brandCount: 0,
  status: 'active',
  createdAt: item.created_at ?? '',
  company_type: item.company_type ?? null,
  business_entity_id: item.business_entity_id ?? null,
})

export const useCompanyStore = defineStore('company', () => {
  const companies = ref<Company[]>([])
  const loadedTenantId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCompanies = async (tenantId?: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await companyApi.list()
      companies.value = response.map(normalizeCompany)
      loadedTenantId.value = tenantId ?? null
      return companies.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Şirket listesi alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    companies,
    loadedTenantId,
    loading,
    error,
    fetchCompanies,
  }
})
