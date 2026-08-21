import type { Tenant } from '~/types/tenant'
import { apiClient } from './client'

export type TenantListResponse = { data: Tenant[] }
export type TenantResponse = { data: Tenant; message?: string }
export type TenantDeleteResponse = { message: string }

const normalizeTenant = (tenant: Tenant): Tenant => ({
  ...tenant,
  status: tenant.status === true ? 'active' : tenant.status === false ? 'passive' : tenant.status,
})

export const tenantApi = {
  list: async () => {
    const response = await apiClient<TenantListResponse>('/api/tenants')
    return { ...response, data: response.data.map(normalizeTenant) }
  },
  get: async (id: number) => {
    const response = await apiClient<TenantResponse>(`/api/tenants/${id}`)
    return { ...response, data: normalizeTenant(response.data) }
  },
  create: async (payload: Record<string, unknown>) => {
    const response = await apiClient<TenantResponse>('/api/tenants', { method: 'POST', body: payload })
    return { ...response, data: normalizeTenant(response.data) }
  },
  update: async (id: number, payload: Record<string, unknown>) => {
    const response = await apiClient<TenantResponse>(`/api/tenants/${id}`, { method: 'PUT', body: payload })
    return { ...response, data: normalizeTenant(response.data) }
  },
  remove: (id: number) =>
    apiClient<TenantDeleteResponse>(`/api/tenants/${id}`, { method: 'DELETE' }),
}
