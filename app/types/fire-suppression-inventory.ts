export type FireSuppressionCategory =
  | 'yangin_dolabi'
  | 'sprinkler'
  | 'hidrant'
  | 'yangin_pompasi'
  | 'su_deposu'
  | 'gazli_sondurme'
  | 'diger'

export type FireSuppressionComplianceStatus = 'uygun' | 'uygun_degil'
export type FireSuppressionPeriodicControlStatus = 'kontrolu_gecerli' | 'kontrol_yaklasiyor' | 'kontrol_gecikmis'

export const FIRE_SUPPRESSION_CATEGORIES: FireSuppressionCategory[] = [
  'yangin_dolabi',
  'sprinkler',
  'hidrant',
  'yangin_pompasi',
  'su_deposu',
  'gazli_sondurme',
  'diger',
]

export const FIRE_SUPPRESSION_CATEGORY_LABELS: Record<FireSuppressionCategory, string> = {
  yangin_dolabi: 'Yangın Dolapları',
  sprinkler: 'Sprinkler',
  hidrant: 'Hidrantlar',
  yangin_pompasi: 'Yangın Pompaları',
  su_deposu: 'Su Depoları',
  gazli_sondurme: 'Gazlı Söndürme',
  diger: 'Diğer',
}

export type FireSuppressionInventoryItem = {
  id: number
  location_business_entity_id: number
  category: FireSuppressionCategory
  code?: string | null
  location_note?: string | null
  is_active: boolean
  last_control_date?: string | null
  next_control_date?: string | null
  compliance_status?: FireSuppressionComplianceStatus | null
  open_nonconformity_count: number
  notes?: string | null
  periodic_control_status?: FireSuppressionPeriodicControlStatus | null
}

export type FireSuppressionInventoryPayload = {
  category: FireSuppressionCategory
  code?: string | null
  location_note?: string | null
  is_active?: boolean
  last_control_date?: string | null
  next_control_date?: string | null
  compliance_status?: FireSuppressionComplianceStatus | null
  open_nonconformity_count?: number
  notes?: string | null
}

export type FireSuppressionCategorySummary = {
  category: FireSuppressionCategory
  total: number
  nonconformity_count: number
}

export type FireSuppressionInventorySummary = {
  overall_status: FireSuppressionComplianceStatus
  total_equipment: number
  total_nonconformity: number
  last_control_date?: string | null
  categories: FireSuppressionCategorySummary[]
}
