import { apiClient } from './client'

export const organizationCompanyApi = {
  attach: async (organizationId: number, companyId: number) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/companies/${companyId}`, { method: 'POST' }),
  detach: async (organizationId: number, companyId: number) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/companies/${companyId}`, { method: 'DELETE' }),
  sync: async (organizationId: number, companyIds: number[]) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/companies/sync`, { method: 'POST', body: { company_ids: companyIds } }),
}
