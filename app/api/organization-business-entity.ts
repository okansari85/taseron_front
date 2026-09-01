import { apiClient } from './client'

export type ContractorOrganizationMatch = {
  id: number
  tenant_id: number
  type: 'contractor'
  name: string
  contractor?: {
    id: number
    business_entity_id: number
    contractor_type: 'permanent' | 'temporary'
    short_name: string | null
    logo_path: string | null
    status: 'active' | 'passive'
  }
  organizations: Array<{
    id: number
    name: string
    type: 'holding' | 'group'
    parent_id: number | null
  }>
}

export const organizationBusinessEntityApi = {
  listContractors: async () =>
    apiClient<ContractorOrganizationMatch[]>('/api/organization-business-entities/contractors'),

  attach: async (organizationId: number, businessEntityId: number) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/business-entities/${businessEntityId}`, {
      method: 'POST',
    }),

  detach: async (organizationId: number, businessEntityId: number) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/business-entities/${businessEntityId}`, {
      method: 'DELETE',
    }),
}
