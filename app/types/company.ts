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

export type CompanyApiRecord = {
  id: number
  name: string
  company_type?: string | null
  business_entity_id?: number | null
  created_at?: string
  updated_at?: string
}
