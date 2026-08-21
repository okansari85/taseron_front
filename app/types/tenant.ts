export type TenantStatus = 'active' | 'passive'
export type TenantOnboardingType = 'holding' | 'group' | 'company'
export type CompanyType = 'individual' | 'corporate'

export type TenantRootOrganization = {
  id: number
  name: string
  type: TenantOnboardingType
  parent_id: number | null
}

export type Tenant = {
  id: number
  name: string
  slug: string
  status: TenantStatus
  onboarding_type: TenantOnboardingType
  logo_path?: string | null
  logo_url?: string | null
  root_organization?: TenantRootOrganization | null
  created_at: string
  [key: string]: unknown
}

export type TenantOnboardingPayload = {
  onboarding_type: TenantOnboardingType
  tenant: {
    name: string
    slug: string
    status?: TenantStatus
  }
  organization: {
    name: string
  }
  company?: {
    name: string
    company_type: CompanyType
  }
  location?: {
    name: string
  }
  logo?: File | null
}

export type TenantOnboardingResponse = {
  tenant: Tenant
  organization: Record<string, unknown>
  company: Record<string, unknown> | null
  location: Record<string, unknown> | null
}
