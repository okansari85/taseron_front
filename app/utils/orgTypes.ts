export interface OrgTypeOption {
  value: 'holding' | 'group' | 'company' | 'brand'
  label: 'Holding' | 'Grup' | 'Şirket' | 'Marka'
  icon: string
}

export const ORG_TYPES: OrgTypeOption[] = [
  { value: 'holding', label: 'Holding', icon: 'mdi-bank-outline' },
  { value: 'group', label: 'Grup', icon: 'mdi-account-group-outline' },
  { value: 'company', label: 'Şirket', icon: 'mdi-domain' },
  { value: 'brand', label: 'Marka', icon: 'mdi-tag-outline' },
]
