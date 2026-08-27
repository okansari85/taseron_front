export type CompanyStatus = 'active' | 'passive'

export type Company = {
  id: number
  name: string
  shortName: string
  group: string
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
  company_type?: string | null
  business_entity_id?: number | null
  created_at?: string
  updated_at?: string
  brands_count?: number
  business_entity?: {
    id: number
    tenant_id: number
    type: string
    name: string
  } | null
  organizations?: CompanyOrganization[]
}
