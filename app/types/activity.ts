export type Activity = {
  id: number
  tenant_id: number
  name: string
  description: string | null
  is_active: boolean
  location_business_entities_count?: number
  required_company_documents_count?: number
  required_personnel_documents_count?: number
  created_at?: string
  updated_at?: string
}

export type ActivityPayload = {
  name: string
  description?: string | null
  is_active?: boolean
}

export type DocumentTarget = 'company' | 'personnel'

export type ActivityDocumentType = {
  id: number
  activity_id: number
  document_type_id: number
  target: DocumentTarget
  is_required: boolean
  validity_days: number | null
  description: string | null
  document_type: {
    id: number
    name: string
    type: 'document_upload' | 'training_video'
    is_active: boolean
  }
  created_at?: string
  updated_at?: string
}

export type ActivityDocumentTypePayload = {
  target: DocumentTarget
  name: string
  type?: 'document_upload' | 'training_video'
  is_required?: boolean
  validity_days?: number | null
  description?: string | null
}
