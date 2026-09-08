export type EmergencyEquipmentTypeParentRef = {
  id: number
  name: string
}

export type EmergencyEquipmentType = {
  id: number
  tenant_id: number
  parent_id: number | null
  name: string
  description: string | null
  capacity_kg: string | null
  tip: string | null
  inspection_frequency_days: number | null
  is_active: boolean
  location_equipment_count?: number
  checklist_items_count?: number
  children_count?: number
  parent?: EmergencyEquipmentTypeParentRef | null
  created_at?: string
  updated_at?: string
}

export type EmergencyEquipmentTypePayload = {
  name: string
  description?: string | null
  parent_id?: number | null
  capacity_kg?: number | string | null
  tip?: string | null
  inspection_frequency_days?: number | null
  is_active?: boolean
}

export type EmergencyEquipmentTypeTipOption = {
  id: number
  equipment_type_id: number
  label: string
  sort_order: number
}

export type EmergencyEquipmentTypeTipOptionPayload = {
  label: string
  sort_order?: number
}

export type EmergencyEquipmentChecklistItem = {
  id: number
  equipment_type_id: number
  label: string
  sort_order: number
  is_active: boolean
  is_excluded?: boolean
  created_at?: string
  updated_at?: string
}

export type EmergencyEquipmentChecklistItemPayload = {
  label: string
  sort_order?: number
  is_active?: boolean
}
