export type Tenant = {
  id: number
  name: string
  slug: string
  [key: string]: unknown
}

export type TenantOnboardingType = 'holding' | 'group' | 'company'
export type CompanyType = 'individual' | 'corporate'

export type TenantOnboardingPayload = {
  onboarding_type: TenantOnboardingType
  tenant: {
    name: string
    slug: string
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
}

export type TenantOnboardingResponse = {
  tenant: Tenant
  organization: Record<string, unknown>
  company: Record<string, unknown> | null
  location: Record<string, unknown> | null
}
