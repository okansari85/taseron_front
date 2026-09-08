import { apiClient } from './client'

export type TenantBranding = {
  tenant_id: number
  tenant_name: string
  featured_brand: { id: number; name: string; logo_url: string | null } | null
}

type TenantBrandingResponse = { data: TenantBranding }

export const tenantBrandingApi = {
  get: () => apiClient<TenantBrandingResponse>('/api/tenant-branding'),
}
