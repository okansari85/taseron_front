import { apiClient } from './client'

export type ContractorApiRecord = {
  id: number
  business_entity_id: number
  contractor_type: 'permanent' | 'temporary'
  short_name: string | null
  logo_path: string | null
  status: 'active' | 'passive'
  business_entity?: {
    id: number
    tenant_id: number
    type: 'contractor'
    name: string
  }
}

export type ContractorPayload = {
  name: string
  shortName: string
  contractor_type: 'permanent' | 'temporary'
  status: 'active' | 'passive'
  logo: File | null
}

export type ContractorCreateResponse = ContractorApiRecord

export type ContractorLocationBrandRef = { id: number; name: string }
export type ContractorLocationCityRef = { id: number; name: string }
export type ContractorLocationRef = {
  id: number
  name: string
  address: string | null
  city_id: number | null
  district_id: number | null
  is_active: boolean
  city?: ContractorLocationCityRef | null
  district?: ContractorLocationCityRef | null
}
export type ContractorOperationalRegionRef = { id: number; name: string; type: string }
export type ContractorBusinessEntityRef = { id: number; name: string; type: string }

export type ContractorLocationItem = {
  id: number
  location_id: number
  business_entity_id: number
  operational_region_id: number | null
  nace_code: string | null
  hazard_class: string | null
  location?: ContractorLocationRef | null
  business_entity?: ContractorBusinessEntityRef | null
  operational_region?: ContractorOperationalRegionRef | null
  brands?: ContractorLocationBrandRef[]
}

const toFormData = (payload: ContractorPayload, method?: 'PUT') => {
  const formData = new FormData()

  formData.append('name', payload.name)
  formData.append('short_name', payload.shortName)
  formData.append('contractor_type', payload.contractor_type)
  formData.append('status', payload.status)

  if (payload.logo) formData.append('logo', payload.logo)
  if (method) formData.append('_method', method)

  return formData
}

export const contractorApi = {
  list: async () =>
    apiClient<ContractorApiRecord[]>('/api/contractors'),

  get: async (id: number) =>
    apiClient<ContractorApiRecord>(`/api/contractors/${id}`),

  locations: async (id: number) =>
    apiClient<ContractorLocationItem[]>(`/api/contractors/${id}/locations`),

  create: async (payload: ContractorPayload) =>
    apiClient<ContractorCreateResponse>('/api/contractors', {
      method: 'POST',
      body: toFormData(payload),
    }),

  update: async (id: number, payload: ContractorPayload) =>
    apiClient<ContractorApiRecord>(`/api/contractors/${id}`, {
      method: 'POST',
      body: toFormData(payload, 'PUT'),
    }),

  remove: async (id: number) =>
    apiClient<void>(`/api/contractors/${id}`, {
      method: 'DELETE',
    }),
}
