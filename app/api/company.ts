import type { CompanyApiRecord } from '~/types/company'
import { apiClient } from './client'

export type CompanyListResponse = CompanyApiRecord[]
export type CompanyResponse = CompanyApiRecord
export type CompanyDeleteResponse = { message: string }

export const companyApi = {
  list: async () => apiClient<CompanyListResponse>('/api/organization-companies'),
  get: async (id: number) => apiClient<CompanyResponse>(`/api/companies/${id}`),
  create: async (payload: { name: string; company_type: 'individual' | 'corporate' }) => apiClient<CompanyResponse>('/api/companies', { method: 'POST', body: payload }),
  update: async (id: number, payload: { name?: string; company_type?: 'individual' | 'corporate' }) => apiClient<CompanyResponse>(`/api/companies/${id}`, { method: 'PUT', body: payload }),
  remove: async (id: number) => apiClient<CompanyDeleteResponse>(`/api/companies/${id}`, { method: 'DELETE' }),
}
