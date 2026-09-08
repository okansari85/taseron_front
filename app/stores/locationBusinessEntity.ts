import { defineStore } from 'pinia'
import { locationBusinessEntityApi } from '~/api/location-business-entity'
import type { LocationBusinessEntityItem } from '~/types/location-business-entity'

export const useLocationBusinessEntityStore = defineStore('locationBusinessEntity', () => {
  const items = ref<LocationBusinessEntityItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchItems = async () => {
    loading.value = true
    error.value = null
    try {
      items.value = await locationBusinessEntityApi.forTenant()
      return items.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Şubeler yüklenemedi.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchItems }
})
