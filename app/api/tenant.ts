import type { Tenant } from '~/types/tenant'
import { apiClient } from './client'

export type TenantListResponse = { data: Tenant[] }
export type TenantResponse = { data: Tenant; message?: string }
export type TenantDeleteResponse = { message: string }

export const tenantApi = {
  list: () => apiClient<TenantListResponse>('/api/tenants'),
  get: (id: number) => apiClient<TenantResponse>(`/api/tenants/${id}`),
  create: (payload: Record<string, unknown>) =>
    apiClient<TenantResponse>('/api/tenants', { method: 'POST', body: payload }),
  update: (id: number, payload: Record<string, unknown>) =>
    apiClient<TenantResponse>(`/api/tenants/${id}`, { method: 'PUT', body: payload }),
  remove: (id: number) =>
    apiClient<TenantDeleteResponse>(`/api/tenants/${id}`, { method: 'DELETE' }),
}
