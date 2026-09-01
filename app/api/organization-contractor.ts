import { apiClient } from './client'

export type ContractorOrganizationMatch = {
  id: number
  tenant_id: number
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

export const organizationContractorApi = {
  listContractors: async () =>
    apiClient<ContractorOrganizationMatch[]>('/api/organization-contractors'),

  list: async (organizationId: number) =>
    apiClient(`/api/organizations/${organizationId}/contractors`),

  bulkAttach: async (organizationIds: number[], contractorIds: number[]) =>
    apiClient<{ message: string; count: number }>('/api/organizations/contractors/bulk', {
      method: 'POST',
      body: { organization_ids: organizationIds, contractor_ids: contractorIds },
    }),

  attach: async (organizationId: number, contractorId: number) =>
    apiClient<{ id: number; message?: string }>(`/api/organizations/${organizationId}/contractors/${contractorId}`, {
      method: 'POST',
    }),

  detach: async (organizationId: number, contractorId: number) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/contractors/${contractorId}`, {
      method: 'DELETE',
    }),
}
