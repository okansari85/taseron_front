export type FieldFindingCategory = 'yangin_guvenligi' | 'acil_cikis' | 'yangin_kapisi' | 'kacis_yolu' | 'diger'
export type FieldFindingSeverity = 'dusuk' | 'orta' | 'yuksek' | 'kritik'
export type FieldFindingStatus = 'open' | 'closed'

export type FieldFindingPhoto = { id: number; photo_path: string; order_no: number; photo_url: string }
export type FieldFindingUserRef = { id: number; name: string }

export type FieldFindingRecord = {
  id: number
  location_business_entity_id: number
  category: FieldFindingCategory
  location_note?: string | null
  description?: string | null
  severity: FieldFindingSeverity
  status: FieldFindingStatus
  reported_by_user_id?: number | null
  reported_by_user?: FieldFindingUserRef | null
  photos: FieldFindingPhoto[]
  created_at: string
}

export type FieldFindingPayload = {
  category: FieldFindingCategory
  location_note?: string | null
  description?: string | null
  severity: FieldFindingSeverity
  photos?: File[]
}

export type FieldFindingUpdatePayload = Partial<FieldFindingPayload> & {
  status?: FieldFindingStatus
  remove_photo_ids?: number[]
}
