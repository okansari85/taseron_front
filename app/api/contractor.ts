import { apiClient } from './client'

export type ContractorApiRecord = {
  id: number
  business_entity_id: number
  contractor_type: 'permanent' | 'temporary'
  business_entity?: {
    id: number
    tenant_id: number
    type: 'contractor'
    name: string
  }
}

export type ContractorCreateResponse = ContractorApiRecord

export const contractorApi = {
  list: async () =>
    apiClient<ContractorApiRecord[]>('/api/contractors'),

  create: async (payload: { name: string; contractor_type: 'permanent' | 'temporary' }) =>
    apiClient<ContractorCreateResponse>('/api/contractors', {
      method: 'POST',
      body: payload,
    }),
}
