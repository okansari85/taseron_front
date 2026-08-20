export interface OrgTypeOption {
  value: 'holding' | 'group' | 'company'
  label: 'Holding' | 'Grup' | 'Şirket'
  suffix: string
  icon: string
}

export const ORG_TYPES: OrgTypeOption[] = [
  { value: 'holding', label: 'Holding', suffix: 'Holding', icon: 'Building2' },
  { value: 'group', label: 'Grup', suffix: 'Grup', icon: 'UsersRound' },
  { value: 'company', label: 'Şirket', suffix: 'Firma', icon: 'Building' },
]
