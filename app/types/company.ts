export type CompanyStatus = 'active' | 'passive'

export type Company = {
  id: number
  name: string
  shortName: string
  description: string
  group: string
  groupId?: number | null
  brandCount: number
  status: CompanyStatus
  createdAt: string
  company_type?: string | null
  business_entity_id?: number | null
}

export type CompanyOrganization = {
  id: number
  name: string
  type?: string | null
}

export type CompanyApiRecord = {
  id: number
  name: string
  short_name?: string | null
  description?: string | null
  is_active?: boolean | null
  company_type?: string | null
  business_entity_id?: number | null
  created_at?: string
  updated_at?: string
  brands_count?: number
  business_entity?: { id: number; tenant_id: number; type: string } | null
  organizations?: CompanyOrganization[]
}
