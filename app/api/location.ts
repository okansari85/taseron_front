import { apiClient } from './client'

export type LocationOrganization = { id: number; name: string }
export type LocationApiItem = {
  id: number
  tenant_id: number
  name: string
  address?: string | null
  city_id?: number | null
  district_id?: number | null
  city?: { id: number; name: string } | null
  district?: { id: number; name: string } | null
  image?: string | null
  latitude?: number | null
  longitude?: number | null
  is_active?: boolean
  organizations?: LocationOrganization[]
}

export const locationApi = {
  list: (_tenantId: number | string) => apiClient<LocationApiItem[]>('/api/locations'),
  get: (_tenantId: number | string, id: number) => apiClient<LocationApiItem>(`/api/locations/${id}`),
  create: (_tenantId: number | string, form: FormData) => apiClient<LocationApiItem>('/api/locations', { method: 'POST', body: form }),
  update: (_tenantId: number | string, id: number, form: FormData) => apiClient<LocationApiItem>(`/api/locations/${id}`, { method: 'PUT', body: form }),
  remove: (_tenantId: number | string, id: number) => apiClient<void>(`/api/locations/${id}`, { method: 'DELETE' }),
  listOrganizationLocations: (organizationId: number) => apiClient<LocationApiItem[]>(`/api/organizations/${organizationId}/locations`),
  attachOrganization: (organizationId: number, locationId: number) => apiClient<LocationApiItem>(`/api/organizations/${organizationId}/locations/${locationId}`, { method: 'POST' }),
  detachOrganization: (organizationId: number, locationId: number) => apiClient<void>(`/api/organizations/${organizationId}/locations/${locationId}`, { method: 'DELETE' }),
  syncOrganization: (organizationId: number, locationIds: number[]) => apiClient<LocationApiItem[]>(`/api/organizations/${organizationId}/locations`, { method: 'PUT', body: { location_ids: locationIds } }),
}
