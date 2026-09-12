import type { FireSuppressionCategory, FireSuppressionComplianceStatus, FireSuppressionInventoryItem } from './fire-suppression-inventory'

export type FireSuppressionFindingScope = 'all' | 'specific' | 'area' | 'unknown'
export type FireSuppressionFindingStatus = 'open' | 'closed'

export type FireSuppressionControlItemStatus = 'uygun' | 'uygun_degil' | 'uygulanamiyor'
export type FireSuppressionReportFileType = 'fotograf' | 'ek_belge' | 'diger'

export const FIRE_SUPPRESSION_CONTROL_ITEM_STATUS_LABELS: Record<FireSuppressionControlItemStatus, string> = {
  uygun: 'Uygun',
  uygun_degil: 'Uygun Değil',
  uygulanamiyor: 'Uygulanamıyor',
}

export const FIRE_SUPPRESSION_REPORT_FILE_TYPE_LABELS: Record<FireSuppressionReportFileType, string> = {
  fotograf: 'Fotoğraf',
  ek_belge: 'Ek Belge',
  diger: 'Diğer',
}

// Kategori bazlı standart checklist — sadece referans, tenant'a bağlı değil.
export type FireSuppressionControlItemTemplate = {
  id: number
  category: FireSuppressionCategory
  code?: string | null
  section?: string | null
  title: string
  sort_order: number
}

export type FireSuppressionReportControlItem = {
  id: number
  report_id: number
  template_id?: number | null
  equipment_code?: string | null
  inventory_item_id?: number | null
  category?: FireSuppressionCategory | null
  code?: string | null
  section?: string | null
  title: string
  status: FireSuppressionControlItemStatus
  description?: string | null
  sort_order: number
}

export type FireSuppressionReportControlItemInput = {
  template_id?: number | null
  equipment_code?: string | null
  inventory_item_id?: number | null
  category?: FireSuppressionCategory | null
  code?: string | null
  section?: string | null
  title: string
  status: FireSuppressionControlItemStatus
  description?: string | null
}

export type FireSuppressionReportFile = {
  id: number
  report_id: number
  file_type: FireSuppressionReportFileType
  file_path: string
  file_name: string
  file_size: number
  file_url: string
  description?: string | null
  uploaded_by_user?: FireSuppressionReportUser | null
}

export type FireSuppressionReportFileInput = {
  file: File
  type: FireSuppressionReportFileType
  description?: string | null
}

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
  report_no?: string | null
  next_control_date?: string | null
  covered_categories?: FireSuppressionCategory[] | null
  overall_result?: FireSuppressionComplianceStatus | null
  inspection_company_name?: string | null
  file_path: string
  file_name: string
  file_url: string
  notes?: string | null
  is_current?: boolean
  created_at?: string
  findings_count?: number
  findings?: FireSuppressionReportFinding[]
  inventory_items?: FireSuppressionInventoryItem[]
  uploaded_by_user?: FireSuppressionReportUser | null
  control_items?: FireSuppressionReportControlItem[]
  files?: FireSuppressionReportFile[]
}

// "Tesisat Durumu > Sistem" detay ekranı — bir sistemin kalıcı bileşenleri
// (registry) ile SON raporun o sisteme ait kontrol/bulgu verisi birlikte.
// İkisi ayrı kaynaktır: components rapordan bağımsız kalıcı kayıt,
// control_items/findings sadece en son raporun o anki içeriğidir.
export type FireSuppressionSystemComponentDetail = {
  category: FireSuppressionCategory
  components: FireSuppressionInventoryItem[]
  control_items: FireSuppressionReportControlItem[]
  findings: FireSuppressionReportFinding[]
  report: { id: number; report_date: string; report_no?: string | null } | null
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
  report_no?: string | null
  next_control_date?: string | null
  covered_categories?: FireSuppressionCategory[]
  overall_result?: FireSuppressionComplianceStatus | null
  inspection_company_name?: string | null
  notes?: string | null
  file: File
  findings?: FireSuppressionReportFindingInput[]
  covered_inventory_item_ids?: number[]
  control_items?: FireSuppressionReportControlItemInput[]
  additional_files?: FireSuppressionReportFileInput[]
  // Raporda tespit edilip envanterde henüz kayıtlı olmayan, kullanıcının
  // Eşleştirme adımında "envantere ekle" diye onayladığı whole_unit
  // kategoriler (Su Deposu, Sabit Boru gibi) — bkz. upload.vue: detectedNewCategories.
  approved_new_categories?: FireSuppressionCategory[]
}

// Matching Engine'in her ekipman satırı için döndürdüğü eşleşme durumu
// (backend: MatchingEngine::match() — bu tip sadece o çıktıyı taşır,
// eşleştirme mantığının kendisi backend'de kalır).
export type FireSuppressionEquipmentMatch = {
  status: 'exact' | 'candidate_single' | 'candidate_multiple' | 'new'
  matched_id: number | null
  candidate_ids: number[]
}

export type FireSuppressionReportAnalysisSystem = {
  name: string | null
  category: FireSuppressionCategory
  control_count: number
  nonconforming_count: number
  components: Array<{
    code: string | null
    name: string | null
    location: string | null
    brand: string | null
    model: string | null
    serial_no: string | null
  }>
}

// AI ön-analizinin döndürdüğü TASLAK — hiçbir şey kaydedilmedi,
// kullanıcı gözden geçirip düzenledikten sonra normal create() akışına gider.
export type FireSuppressionReportAnalysisDraft = {
  control_date?: string | null
  next_control_date?: string | null
  overall_result?: FireSuppressionComplianceStatus | null
  company_name?: string | null
  covered_categories?: FireSuppressionCategory[]
  systems?: FireSuppressionReportAnalysisSystem[]
  equipment?: {
    code?: string | null
    category?: FireSuppressionCategory | null
    location_note?: string | null
    brand?: string | null
    model?: string | null
    serial_no?: string | null
    result?: FireSuppressionComplianceStatus | null
    note?: string | null
    control_items?: { code?: string | null; title: string; status: FireSuppressionControlItemStatus; description?: string | null }[]
    match?: FireSuppressionEquipmentMatch
  }[]
  findings?: { category?: FireSuppressionCategory | null; control_item?: string | null; description: string; scope: FireSuppressionFindingScope; area_note?: string | null; equipment_codes?: string[] }[]
  matched_inventory_items: FireSuppressionInventoryItem[]
  candidate_inventory_items?: FireSuppressionInventoryItem[]
  unmatched_codes: string[]
  raw_text_excerpt?: string
}