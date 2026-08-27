import type { Organization, OrganizationPayload } from '~/types/organization'
import { apiClient } from './client'

export type OrganizationListResponse = Organization[]
export type OrganizationResponse = Organization
export type OrganizationDeleteResponse = { message: string }

export const organizationApi = {
  list: async () => apiClient<OrganizationListResponse>('/api/organizations'),

  listForTenant: async (tenantId: number) =>
    apiClient<OrganizationListResponse>('/api/organizations', {
      headers: { 'X-Tenant-ID': String(tenantId) },
    }),

  get: async (id: number) =>
    apiClient<OrganizationResponse>(`/api/organizations/${id}`),

  create: async (payload: OrganizationPayload) =>
    apiClient<OrganizationResponse>('/api/organizations', {
      method: 'POST',
      body: payload,
    }),

  createForTenant: async (tenantId: number, payload: OrganizationPayload) =>
    apiClient<OrganizationResponse>('/api/organizations', {
      method: 'POST',
      body: payload,
      headers: { 'X-Tenant-ID': String(tenantId) },
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
