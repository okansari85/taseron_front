import { defineStore } from 'pinia'
import { locationApi, type LocationApiItem } from '~/api/location'

export type LocationStatus = 'active' | 'passive'

export type LocationBusinessEntity = {
  id: number
  companyName: string
  brandName?: string
  logoUrl: string
}

export type Location = {
  id: number
  name: string
  city: string
  district: string
  address: string
  businessEntities: LocationBusinessEntity[]
  contractorCount: number
  status: LocationStatus
  image: string
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80'

const normalizeLocation = (item: LocationApiItem): Location => {
  const entities: any[] = (item as any).business_entities || (item as any).businessEntities || []
  return {
    id: item.id,
    name: item.name,
    city: item.city?.name || '',
    district: item.district?.name || '',
    address: item.address || '',
    businessEntities: entities
      .filter((entity: any) => entity.company)
      .map((entity: any) => {
        const brand = entity.pivot?.brands?.[0]
        return {
          id: entity.id,
          companyName: entity.company.name,
          brandName: brand?.name || '',
          logoUrl: brand?.logo_url || '',
        }
      }),
    contractorCount: 0,
    status: item.is_active === false ? 'passive' : 'active',
    image: item.image || FALLBACK_IMAGE,
  }
}

export const useLocationStore = defineStore('location', () => {
  const locations = ref<Location[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const updatingId = ref<number | null>(null)
  const deletingId = ref<number | null>(null)
  const error = ref<string | null>(null)

  const fetchLocations = async (tenantId: number | string) => {
    loading.value = true
    error.value = null
    try {
      const response: any = await locationApi.list(tenantId)
      locations.value = (Array.isArray(response) ? response : response?.data || []).map(normalizeLocation)
      return locations.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lokasyonlar yüklenemedi.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getLocation = async (tenantId: number | string, id: number) => {
    error.value = null
    try {
      return await locationApi.get(tenantId, id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lokasyon bilgileri alınamadı.'
      throw err
    }
  }

  const createLocation = async (tenantId: number | string, form: FormData) => {
    saving.value = true
    error.value = null
    try {
      const created = await locationApi.create(tenantId, form)
      locations.value = [normalizeLocation(created), ...locations.value]
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lokasyon oluşturulamadı.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const updateLocation = async (tenantId: number | string, id: number, form: FormData) => {
    updatingId.value = id
    error.value = null
    try {
      const updated = await locationApi.update(tenantId, id, form)
      const location = normalizeLocation(updated)
      const index = locations.value.findIndex(item => item.id === id)
      if (index !== -1) locations.value.splice(index, 1, location)
      else locations.value = [location, ...locations.value]
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lokasyon güncellenemedi.'
      throw err
    } finally {
      updatingId.value = null
    }
  }

  const deleteLocation = async (tenantId: number | string, id: number) => {
    deletingId.value = id
    error.value = null
    try {
      await locationApi.remove(tenantId, id)
      locations.value = locations.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lokasyon silinemedi.'
      throw err
    } finally {
      deletingId.value = null
    }
  }

  return {
    locations,
    loading,
    saving,
    updatingId,
    deletingId,
    error,
    fetchLocations,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,
  }
})
