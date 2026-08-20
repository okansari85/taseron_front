export interface TenantFormState {
  tenantName: string
  slug: string
  slugTouched: boolean
  status: 'active' | 'passive'
  orgName: string
  orgNameTouched: boolean
  onboardingType: 'holding' | 'group' | 'company' | null
  companyKind: 'tuzel' | 'sahis'
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
  }))
}

export function useTenantStep() {
  return useState<number>('tenant-step', () => 0)
}
