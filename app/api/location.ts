import { apiClient } from './client'

export type LocationOrganization = { id: number; name: string }
export type LocationBrand = { id: number; name: string }
export type LocationCompany = { id: number; name: string; brands?: LocationBrand[] }
export type LocationBusinessEntity = { id: number; name: string; type?: string; company?: LocationCompany|null }
export type City = { id: number; name: string }
export type District = { id: number; city_id: number; name: string }
export type LocationApiItem = { id:number; tenant_id:number; name:string; address?:string|null; city_id?:number|null; district_id?:number|null; city?:City|null; district?:District|null; image?:string|null; latitude?:number|null; longitude?:number|null; is_active?:boolean; organizations?:LocationOrganization[]; businessEntities?:LocationBusinessEntity[] }

export const locationApi = {
 list: (_tenantId:number|string) => apiClient<LocationApiItem[]>('/api/locations'),
 get: (_tenantId:number|string,id:number) => apiClient<LocationApiItem>(`/api/locations/${id}`),
 create: (_tenantId:number|string,form:FormData) => apiClient<LocationApiItem>('/api/locations',{method:'POST',body:form}),
 update: (_tenantId:number|string,id:number,form:FormData) => { form.append('_method','PUT'); return apiClient<LocationApiItem>(`/api/locations/${id}`,{method:'POST',body:form}) },
 remove: (_tenantId:number|string,id:number) => apiClient<void>(`/api/locations/${id}`,{method:'DELETE'}),
 cities: () => apiClient<City[]>('/api/cities'),
 districts: (cityId:number) => apiClient<District[]>(`/api/cities/${cityId}/districts`),
 listOrganizationLocations: (organizationId:number) => apiClient<LocationApiItem[]>(`/api/organizations/${organizationId}/locations`),
 attachOrganization: (organizationId:number,locationId:number) => apiClient<LocationApiItem>(`/api/organizations/${organizationId}/locations/${locationId}`,{method:'POST'}),
 detachOrganization: (organizationId:number,locationId:number) => apiClient<void>(`/api/organizations/${organizationId}/locations/${locationId}`,{method:'DELETE'}),
 syncOrganization: (organizationId:number,locationIds:number[]) => apiClient<LocationApiItem[]>(`/api/organizations/${organizationId}/locations`,{method:'PUT',body:{location_ids:locationIds}}),
}
