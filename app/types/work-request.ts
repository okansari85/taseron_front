export type WorkRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export type WorkRequestContractorRef = {
  id: number
  contractor_type: 'permanent' | 'temporary'
  short_name: string | null
  business_entity?: { id: number; name: string } | null
}

export type WorkRequestOrganizationRef = { id: number; name: string; type: string }
export type WorkRequestLocationRef = { id: number; name: string }
export type WorkRequestUserRef = { id: number; name: string }

export type WorkRequestItem = {
  id: number
  contractor_id: number
  organization_id: number | null
  location_id: number | null
  title: string
  description: string | null
  requested_date: string | null
  proposed_date: string | null
  status: WorkRequestStatus
  requested_by_name: string | null
  requested_by_user_id: number | null
  contractor?: WorkRequestContractorRef | null
  organization?: WorkRequestOrganizationRef | null
  location?: WorkRequestLocationRef | null
  requested_by_user?: WorkRequestUserRef | null
}

export type WorkRequestPayload = {
  contractor_id: number
  organization_id?: number | null
  title: string
  description?: string | null
  requested_date?: string | null
  requested_by_name?: string | null
}
