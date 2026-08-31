import { apiClient } from './client'

export type LocationApiItem = {
  id: number
  tenant_id: number
  name: string
  organization?: { id: number; name: string } | null
}

export const locationApi = {
  list: async () => apiClient<LocationApiItem[]>('/api/locations'),
  get: async (id: number) => apiClient<LocationApiItem>(`/api/locations/${id}`),
  create: async (payload: Record<string, unknown>) => apiClient<LocationApiItem>('/api/locations', { method: 'POST', body: payload }),
  update: async (id: number, payload: Record<string, unknown>) => apiClient<LocationApiItem>(`/api/locations/${id}`, { method: 'PUT', body: payload }),
  remove: async (id: number) => apiClient<{ message: string }>(`/api/locations/${id}`, { method: 'DELETE' }),
  syncOrganization: async (organizationId: number, locationIds: number[]) =>
    apiClient<LocationApiItem[]>(`/api/organizations/${organizationId}/locations`, {
      method: 'PUT',
      body: { location_ids: locationIds },
    }),
}
