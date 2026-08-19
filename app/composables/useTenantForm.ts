export interface TenantFormState {
  tenantName: string
  slug: string
  slugTouched: boolean
  status: 'active' | 'passive'
  orgName: string
  orgNameTouched: boolean
  orgType: 'holding' | 'group' | 'company' | 'brand' | 'location'
  companyKind: 'tuzel' | 'sahis'
}

export function useTenantForm() {
  return useState<TenantFormState>('tenant-form', () => ({
    tenantName: 'Koç Holding',
    slug: 'koc-holding',
    slugTouched: false,
    status: 'active',
    orgName: '',
    orgNameTouched: false,
    orgType: 'company',
    companyKind: 'sahis',
  }))
}

export function useTenantStep() {
  return useState<number>('tenant-step', () => 0)
}
