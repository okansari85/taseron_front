import { defineStore } from 'pinia'
import { locationApi, type OperationalRegion } from '~/api/location'

export const useLocationOperationalAreaStore = defineStore('locationOperationalArea', () => {
  const areas = ref<OperationalRegion[]>([])
  const loadedLocationId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const deletingId = ref<number | null>(null)
  const error = ref<string | null>(null)

  const fetchAreas = async (locationId: number) => {
    loading.value = true
    error.value = null
    try {
      areas.value = await locationApi.operationalRegions(locationId)
      loadedLocationId.value = locationId
      return areas.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Operasyonel alanlar yüklenemedi.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createArea = async (locationId: number, payload: { name: string; type?: string; is_active?: boolean }) => {
    saving.value = true
    error.value = null
    try {
      const created = await locationApi.createOperationalRegion(locationId, payload)
      areas.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Operasyonel alan eklenemedi.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const updateArea = async (locationId: number, areaId: number, payload: { name: string; type?: string; is_active?: boolean }) => {
    saving.value = true
    error.value = null
    try {
      const updated = await locationApi.updateOperationalRegion(locationId, areaId, payload)
      const index = areas.value.findIndex(item => item.id === areaId)
      if (index !== -1) areas.value.splice(index, 1, updated)
      else areas.value.push(updated)
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Operasyonel alan güncellenemedi.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const deleteArea = async (locationId: number, areaId: number) => {
    deletingId.value = areaId
    error.value = null
    try {
      await locationApi.removeOperationalRegion(locationId, areaId)
      areas.value = areas.value.filter(item => item.id !== areaId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Operasyonel alan silinemedi.'
      throw err
    } finally {
      deletingId.value = null
    }
  }

  return {
    areas,
    loadedLocationId,
    loading,
    saving,
    deletingId,
    error,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
  }
})
