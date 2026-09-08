export type LocationEmergencyEquipmentStatus = 'active' | 'inactive' | 'needs_replacement'

export type EmergencyEquipmentTypeRef = {
  id: number
  name: string
  capacity_kg?: string | null
  tip?: string | null
  inspection_frequency_days?: number | null
}

export type EmergencyEquipmentChecklistItemRef = {
  id: number
  label: string
}

export type EmergencyEquipmentInspectionItemRecord = {
  id: number
  inspection_id: number
  checklist_item_id: number
  note?: string | null
  checklist_item?: EmergencyEquipmentChecklistItemRef | null
  photos?: EmergencyEquipmentInspectionPhoto[]
}

export type EmergencyEquipmentInspectionUserRef = {
  id: number
  name: string
}

export type EmergencyEquipmentInspectionPhoto = { id: number; inspection_item_id?: number | null; photo_path: string; order_no: number; photo_url: string }

export type EmergencyEquipmentInspectionRecord = {
  id: number
  location_emergency_equipment_id: number
  inspected_by_name?: string | null
  inspected_by_user_id?: number | null
  inspected_by_user?: EmergencyEquipmentInspectionUserRef | null
  overall_result: 'passed' | 'failed'
  notes?: string | null
  inspected_at: string
  items?: EmergencyEquipmentInspectionItemRecord[]
  photos?: EmergencyEquipmentInspectionPhoto[]
}

export type LocationEmergencyEquipmentItem = {
  id: number
  location_business_entity_id: number
  equipment_type_id: number
  code?: string | null
  location_note?: string | null
  install_date?: string | null
  status: LocationEmergencyEquipmentStatus
  is_active: boolean
  last_fill_date?: string | null
  last_annual_maintenance_date?: string | null
  next_annual_maintenance_date?: string | null
  service_company?: string | null
  equipment_type?: EmergencyEquipmentTypeRef | null
  latest_inspection?: EmergencyEquipmentInspectionRecord | null
}

export type LocationEmergencyEquipmentPayload = {
  equipment_type_id: number
  code?: string | null
  location_note?: string | null
  install_date?: string | null
  status?: LocationEmergencyEquipmentStatus
  is_active?: boolean
  last_fill_date?: string | null
  last_annual_maintenance_date?: string | null
  next_annual_maintenance_date?: string | null
  service_company?: string | null
}

export type EmergencyEquipmentInspectionItemInput = {
  id?: number | null
  checklist_item_id: number
  note?: string | null
  photo?: File | null
  remove_photo?: boolean
}

export type EmergencyEquipmentInspectionPayload = {
  items?: EmergencyEquipmentInspectionItemInput[]
  notes?: string | null
  inspected_at?: string | null
  inspected_by_user_id?: number | null
  inspected_by_name?: string | null
  photos?: File[]
}

export type EmergencyEquipmentInspectionUpdatePayload = {
  items?: EmergencyEquipmentInspectionItemInput[]
  notes?: string | null
  inspected_at?: string | null
  remove_photo_ids?: number[]
  photos?: File[]
}
