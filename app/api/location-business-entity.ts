import { apiClient } from './client'
import type { LocationBusinessEntityItem } from '~/types/location-business-entity'

export const locationBusinessEntityApi = {
  forTenant: () => apiClient<LocationBusinessEntityItem[]>('/api/location-business-entities'),
}
