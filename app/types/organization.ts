export type OrganizationType = 'holding' | 'group' | 'company' | 'brand' | 'location'

export type Organization = {
  id: number
  tenant_id: number
  parent_id: number | null
  name: string
  type: OrganizationType
  slug?: string | null
  description?: string | null
  code?: string | null
  display_order?: number | null
  is_active?: boolean | number | null
  color?: string | null
  created_at?: string
  updated_at?: string
  parent?: Organization | null
}

export type OrganizationPayload = {
  name: string
  type: OrganizationType
  slug?: string | null
  description?: string | null
  code?: string | null
  display_order?: number
  is_active?: boolean
  parent_id?: number | null
  color?: string | null
}
