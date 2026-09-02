import { apiClient } from './client'

export type LocationOrganization = { id: number; name: string }
export type LocationBrand = { id: number; name: string }
export type LocationCompany = { id: number; name: string; brands?: LocationBrand[] }
export type LocationBusinessEntity = { id: number; name: string; type?: string; company?: LocationCompany|null }
export type City = { id: number; name: string }
export type District = { id: number; city_id: number; name: string }
export type OperationalRegion = { id:number; tenant_id:number; location_id:number; name:string; type?:string|null; is_active:boolean }
export type LocationApiItem = { id:number; tenant_id:number; name:string; address?:string|null; city_id?:number|null; district_id?:number|null; city?:City|null; district?:District|null; image?:string|null; latitude?:number|null; longitude?:number|null; is_active?:boolean; organizations?:LocationOrganization[]; businessEntities?:LocationBusinessEntity[]; operationalRegions?:OperationalRegion[] }
export type LocationOrganizationContractor = { id:number; name:string; contractor_type:'permanent'|'temporary'; short_name?:string|null; logo_path?:string|null; status?:'active'|'passive' }

const unwrap = <T>(response: any): T => response?.data ?? response

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
 operationalRegions: async (locationId:number) => unwrap<OperationalRegion[]>(await apiClient<any>(`/api/locations/${locationId}/operational-regions`)),
 createOperationalRegion: async (locationId:number,payload:{name:string;type?:string;is_active?:boolean}) => unwrap<OperationalRegion>(await apiClient<any>(`/api/locations/${locationId}/operational-regions`,{method:'POST',body:payload})),
 updateOperationalRegion: async (locationId:number,regionId:number,payload:{name:string;type?:string;is_active?:boolean}) => unwrap<OperationalRegion>(await apiClient<any>(`/api/locations/${locationId}/operational-regions/${regionId}`,{method:'PUT',body:payload})),
 removeOperationalRegion: (locationId:number,regionId:number) => apiClient<void>(`/api/locations/${locationId}/operational-regions/${regionId}`,{method:'DELETE'}),
 businessEntities: async (locationId:number) => unwrap<LocationBusinessEntity[]>(await apiClient<any>(`/api/locations/${locationId}/business-entities`)),
 organizationContractors: async (locationId:number) => unwrap<LocationOrganizationContractor[]>(await apiClient<any>(`/api/locations/${locationId}/organization-contractors`)),
 createBusinessEntity: async (locationId:number,payload:Record<string, any>) => unwrap<LocationBusinessEntity>(await apiClient<any>(`/api/locations/${locationId}/business-entities`,{method:'POST',body:payload})),
 updateBusinessEntity: async (locationId:number,businessEntityId:number,payload:Record<string, any>) => unwrap<LocationBusinessEntity>(await apiClient<any>(`/api/locations/${locationId}/business-entities/${businessEntityId}`,{method:'PUT',body:payload})),
 removeBusinessEntity: (locationId:number,businessEntityId:number) => apiClient<void>(`/api/locations/${locationId}/business-entities/${businessEntityId}`,{method:'DELETE'}),
}
