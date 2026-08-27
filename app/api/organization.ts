import type { Organization, OrganizationPayload } from '~/types/organization'
import { apiClient } from './client'

export type OrganizationListResponse = Organization[]
export type OrganizationResponse = Organization
export type OrganizationDeleteResponse = { message: string }

export const organizationApi = {
  list: async () => apiClient<OrganizationListResponse>('/api/organizations'),

  get: async (id: number) =>
    apiClient<OrganizationResponse>(`/api/organizations/${id}`),

  create: async (payload: OrganizationPayload) =>
    apiClient<OrganizationResponse>('/api/organizations', {
      method: 'POST',
      body: payload,
    }),

  update: async (id: number, payload: Partial<OrganizationPayload>) =>
    apiClient<OrganizationResponse>(`/api/organizations/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  remove: async (id: number) =>
    apiClient<OrganizationDeleteResponse>(`/api/organizations/${id}`, {
      method: 'DELETE',
    }),
}
