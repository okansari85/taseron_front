export interface TenantFormState {
  tenantName: string
  slug: string
  slugTouched: boolean
  status: 'active' | 'passive'
  orgName: string
  orgNameTouched: boolean
  onboardingType: 'holding' | 'group' | 'company' | null
  companyKind: 'tuzel' | 'sahis'
  logoFile: File | null
  logoPreview: string
}

export function useTenantForm() {
  return useState<TenantFormState>('tenant-form', () => ({
    tenantName: '',
    slug: '',
    slugTouched: false,
    status: 'active',
    orgName: '',
    orgNameTouched: false,
    onboardingType: null,
    companyKind: 'sahis',
    logoFile: null,
    logoPreview: '',
  }))
}

export function useTenantStep() {
  return useState<number>('tenant-step', () => 0)
}
