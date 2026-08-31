import { defineStore } from 'pinia'
import { brandApi } from '~/api/brand'
import type { Brand, BrandApiRecord, BrandPayload } from '~/types/brand'

const normalizeBrand = (item: BrandApiRecord): Brand => {
  const companies = item.companies ?? []
  const company = companies[0]
  const group = company?.organizations?.find(organization => organization.type === 'group')

  return {
    id: item.id,
    name: item.name,
    shortName: item.short_name ?? '',
    description: item.description ?? '',
    status: item.is_active === false ? 'passive' : 'active',
    logoUrl: item.logo_url ?? null,
    companyIds: companies.map(company => company.id),
    companies,
    company: companies.length > 1 ? `${company?.name ?? '—'} +${companies.length - 1}` : (company?.name ?? '—'),
    group: group?.name ?? '—',
    createdAt: item.created_at ?? '',
  }
}

export const useBrandStore = defineStore('brand', () => {
  const brands = ref<Brand[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  const fetchBrands = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await brandApi.list()
      brands.value = response.data.map(normalizeBrand)
      return brands.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Marka listesi alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createBrand = async (payload: BrandPayload) => {
    saving.value = true
    error.value = null

    try {
      const response = await brandApi.create(payload)
      const brand = normalizeBrand(response.data)
      brands.value.unshift(brand)
      return brand
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Marka oluşturulamadı.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const updateBrand = async (id: number, payload: BrandPayload) => {
    saving.value = true
    error.value = null

    try {
      const response = await brandApi.update(id, payload)
      const brand = normalizeBrand(response.data)
      const index = brands.value.findIndex(item => item.id === id)
      if (index !== -1) brands.value[index] = brand
      return brand
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Marka güncellenemedi.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const deleteBrand = async (id: number) => {
    deleting.value = true
    error.value = null

    try {
      await brandApi.remove(id)
      brands.value = brands.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Marka silinemedi.'
      throw err
    } finally {
      deleting.value = false
    }
  }

  return { brands, loading, saving, deleting, error, fetchBrands, createBrand, updateBrand, deleteBrand }
})
