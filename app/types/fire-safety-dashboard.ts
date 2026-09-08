export type FireSafetyStats = {
  total_branches: number
  total_equipment: number
  up_to_date: number
  upcoming: number
  overdue: number
  open_nonconformities: number
}
export type FireSafetyBrandSlice = { brand_name: string; equipment_count: number }
export type FireSafetyCategorySlice = { equipment_type_name: string; open_count: number }
export type FireSafetyBranchStatus = { location_business_entity_id: number|null; branch_name: string; brand_name: string; equipment_count: number; overdue_count: number; open_count: number; status: 'good'|'warning'|'critical' }
export type FireSafetyDueItem = { equipment_id: number; branch_name: string; equipment_type_name: string; code: string|null; due_date: string; days_overdue?: number; days_until?: number }
export type FireSafetyDashboard = {
  stats: FireSafetyStats
  brand_distribution: FireSafetyBrandSlice[]
  category_nonconformities: FireSafetyCategorySlice[]
  branch_status: FireSafetyBranchStatus[]
  overdue_list: FireSafetyDueItem[]
  upcoming_list: FireSafetyDueItem[]
}
