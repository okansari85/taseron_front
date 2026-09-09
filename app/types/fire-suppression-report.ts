import type { FireSuppressionCategory, FireSuppressionComplianceStatus, FireSuppressionInventoryItem } from './fire-suppression-inventory'

export type FireSuppressionFindingScope = 'all' | 'specific' | 'area' | 'unknown'
export type FireSuppressionFindingStatus = 'open' | 'closed'

export type FireSuppressionReportFinding = {
  id: number
  report_id: number
  category?: FireSuppressionCategory | null
  control_item?: string | null
  description: string
  scope: FireSuppressionFindingScope
  area_note?: string | null
  status: FireSuppressionFindingStatus
  affected_items?: FireSuppressionInventoryItem[]
}

export type FireSuppressionReportUser = { id: number; name: string }

export type FireSuppressionReport = {
  id: number
  location_business_entity_id: number
  report_date: string
  next_control_date?: string | null
  covered_categories?: FireSuppressionCategory[] | null
  overall_result?: FireSuppressionComplianceStatus | null
  file_path: string
  file_name: string
  file_url: string
  notes?: string | null
  is_current?: boolean
  findings_count?: number
  findings?: FireSuppressionReportFinding[]
  inventory_items?: FireSuppressionInventoryItem[]
  uploaded_by_user?: FireSuppressionReportUser | null
}

export type FireSuppressionReportFindingInput = {
  category?: FireSuppressionCategory | null
  control_item?: string | null
  description: string
  scope: FireSuppressionFindingScope
  area_note?: string | null
  affected_item_ids?: number[]
}

export type FireSuppressionReportPayload = {
  report_date: string
  next_control_date?: string | null
  covered_categories?: FireSuppressionCategory[]
  overall_result?: FireSuppressionComplianceStatus | null
  notes?: string | null
  file: File
  findings?: FireSuppressionReportFindingInput[]
  covered_inventory_item_ids?: number[]
}

// AI (NVIDIA NIM) ön-analizinin döndürdüğü TASLAK — hiçbir şey kaydedilmedi,
// kullanıcı gözden geçirip düzenledikten sonra normal create() akışına gider.
export type FireSuppressionReportAnalysisDraft = {
  control_date?: string | null
  next_control_date?: string | null
  overall_result?: FireSuppressionComplianceStatus | null
  covered_categories?: FireSuppressionCategory[]
  equipment?: { code?: string | null; category?: FireSuppressionCategory | null; location_note?: string | null; result?: FireSuppressionComplianceStatus | null }[]
  findings?: { category?: FireSuppressionCategory | null; control_item?: string | null; description: string; scope: FireSuppressionFindingScope; area_note?: string | null; equipment_codes?: string[] }[]
  matched_inventory_items: FireSuppressionInventoryItem[]
  unmatched_codes: string[]
  raw_text_excerpt?: string
}
