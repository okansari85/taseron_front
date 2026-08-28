import type { BrandApiRecord, BrandPayload } from '~/types/brand'
import { apiClient } from './client'

type BrandResponse = { data: BrandApiRecord }
type BrandListResponse = { data: BrandApiRecord[] }
type BrandDeleteResponse = { message: string }

const toFormData = (payload: BrandPayload, method?: 'PUT') => {
  const formData = new FormData()

  formData.append('name', payload.name)
  formData.append('short_name', payload.shortName)
  formData.append('description', payload.description)
  formData.append('is_active', payload.isActive ? '1' : '0')
  payload.companyIds.forEach(id => formData.append('company_ids[]', String(id)))

  if (payload.logo) formData.append('logo', payload.logo)
  if (method) formData.append('_method', method)

  return formData
}

export const brandApi = {
  list: () => apiClient<BrandListResponse>('/api/brands'),
  get: (id: number) => apiClient<BrandResponse>(`/api/brands/${id}`),
  create: (payload: BrandPayload) =>
    apiClient<BrandResponse>('/api/brands', {
      method: 'POST',
      body: toFormData(payload),
    }),
  update: (id: number, payload: BrandPayload) =>
    apiClient<BrandResponse>(`/api/brands/${id}`, {
      method: 'POST',
      body: toFormData(payload, 'PUT'),
    }),
  remove: (id: number) =>
    apiClient<BrandDeleteResponse>(`/api/brands/${id}`, { method: 'DELETE' }),
}
