import type { CompanyOrganization } from '~/types/company'

export type BrandStatus = 'active' | 'passive'

export type BrandCompanyApiRecord = {
  id: number
  name: string
  organizations?: CompanyOrganization[]
}

export type BrandApiRecord = {
  id: number
  name: string
  short_name?: string | null
  description?: string | null
  is_active?: boolean | null
  logo_path?: string | null
  logo_url?: string | null
  created_at?: string | null
  updated_at?: string | null
  companies?: BrandCompanyApiRecord[]
}

export type Brand = {
  id: number
  name: string
  shortName: string
  description: string
  status: BrandStatus
  logoUrl: string | null
  companyId: number | null
  company: string
  group: string
  createdAt: string
}

export type BrandPayload = {
  name: string
  shortName: string
  description: string
  isActive: boolean
  companyIds: number[]
  logo?: File | null
}
