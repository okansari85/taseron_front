import { apiClient } from './client'

export const organizationCompanyApi = {
  attach: async (organizationId: number, businessEntityId: number) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/companies/${businessEntityId}`, { method: 'POST' }),
  detach: async (organizationId: number, businessEntityId: number) =>
    apiClient<{ message: string }>(`/api/organizations/${organizationId}/companies/${businessEntityId}`, { method: 'DELETE' }),
}
