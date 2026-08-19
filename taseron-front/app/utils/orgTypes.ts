export interface OrgTypeOption {
  value: 'holding' | 'group' | 'company' | 'brand' | 'location'
  label: string
  suffix: string
  icon: string
}

export const ORG_TYPES: OrgTypeOption[] = [
  { value: 'holding', label: 'Holding', suffix: 'Holding', icon: 'mdi-bank-outline' },
  { value: 'group', label: 'Group', suffix: 'Grup', icon: 'mdi-account-group-outline' },
  { value: 'company', label: 'Company', suffix: 'Firma', icon: 'mdi-domain' },
  { value: 'brand', label: 'Brand', suffix: 'Marka', icon: 'mdi-tag-outline' },
  { value: 'location', label: 'Location', suffix: 'Lokasyon', icon: 'mdi-map-marker-outline' },
]
