import type { LocationEmergencyEquipmentItem } from './location-emergency-equipment'

export type YscAnnualControlResult = 'uygun' | 'uygun_degil'

export type YscAnnualControlEquipmentInput = {
  id: number
  result?: YscAnnualControlResult | null
  note?: string | null
}

export type YscAnnualControlEquipment = LocationEmergencyEquipmentItem & {
  pivot?: { result?: YscAnnualControlResult | null; note?: string | null }
}

export type YscAnnualControlReport = {
  id: number
  location_business_entity_id: number
  control_date: string
  next_control_date?: string | null
  result?: YscAnnualControlResult | null
  company_name?: string | null
  file_path: string
  file_name: string
  file_url: string
  notes?: string | null
  is_current?: boolean
  equipment_count?: number
  equipment?: YscAnnualControlEquipment[]
  uploaded_by_user?: { id: number; name: string } | null
}

export type YscAnnualControlPayload = {
  control_date: string
  next_control_date?: string | null
  result?: YscAnnualControlResult | null
  company_name?: string | null
  notes?: string | null
  file: File
  equipment?: YscAnnualControlEquipmentInput[]
}

// Matching Engine'in her ekipman satırı için döndürdüğü eşleşme durumu —
// Fire Suppression ile aynı şekil (bkz. FireSuppressionEquipmentMatch),
// MatchingEngine domain'den bağımsız olduğu için.
export type YscEquipmentMatch = {
  status: 'exact' | 'candidate_single' | 'candidate_multiple' | 'new'
  matched_id: number | null
  candidate_ids: number[]
}

// AI (NVIDIA NIM) ön-analizinin döndürdüğü TASLAK — hiçbir şey kaydedilmedi.
export type YscAnnualControlAnalysisDraft = {
  control_date?: string | null
  next_control_date?: string | null
  result?: YscAnnualControlResult | null
  company_name?: string | null
  equipment?: {
    code?: string | null
    equipment_type?: string | null
    capacity?: string | null
    serial_no?: string | null
    location_note?: string | null
    result?: YscAnnualControlResult | null
    note?: string | null
    match?: YscEquipmentMatch
  }[]
  matched_inventory_items: LocationEmergencyEquipmentItem[]
  candidate_inventory_items?: LocationEmergencyEquipmentItem[]
  unmatched_codes: string[]
}
