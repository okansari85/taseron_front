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
}

export type EmergencyEquipmentInspectionUserRef = {
  id: number
  name: string
}

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
}

export type EmergencyEquipmentInspectionPayload = {
  checklist_item_ids?: number[]
  notes?: string | null
  inspected_at?: string | null
  inspected_by_user_id?: number | null
  inspected_by_name?: string | null
}
