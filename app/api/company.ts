import type { CompanyApiRecord } from '~/types/company'
import { apiClient } from './client'

export type CompanyListResponse = CompanyApiRecord[]
export type CompanyResponse = CompanyApiRecord
export type CompanyDeleteResponse = { message: string }

export const companyApi = {
  list: async () => apiClient<CompanyListResponse>('/api/companies'),

  get: async (id: number) =>
    apiClient<CompanyResponse>(`/api/companies/${id}`),

  remove: async (id: number) =>
    apiClient<CompanyDeleteResponse>(`/api/companies/${id}`, {
      method: 'DELETE',
    }),
}
