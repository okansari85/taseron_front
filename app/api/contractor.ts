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
