export interface OrgTypeOption {
  value: 'holding' | 'group' | 'company' | 'brand'
  label: 'Holding' | 'Grup' | 'Şirket' | 'Marka'
  suffix: string
  icon: string
}

export const ORG_TYPES: OrgTypeOption[] = [
  { value: 'holding', label: 'Holding', suffix: 'Holding', icon: 'mdi-bank-outline' },
  { value: 'group', label: 'Grup', suffix: 'Grup', icon: 'mdi-account-group-outline' },
  { value: 'company', label: 'Şirket', suffix: 'Firma', icon: 'mdi-domain' },
  { value: 'brand', label: 'Marka', suffix: 'Marka', icon: 'mdi-tag-outline' },
]
