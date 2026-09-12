import { apiClient } from './client'
import type { FireSuppressionCategory } from '~/types/fire-suppression-inventory'
import type { FireSuppressionControlItemTemplate, FireSuppressionReport, FireSuppressionReportAnalysisDraft, FireSuppressionReportPayload } from '~/types/fire-suppression-report'

type ListResponse = { data: FireSuppressionReport[] }
type ItemResponse = { data: FireSuppressionReport }
type MessageResponse = { message: string }
// analyze() artık taslağı SENKRON döndürmüyor — sadece kuyruğa atıldığını
// onaylıyor (202 Accepted). Gerçek taslak, analiz tamamlandığında
// FireSuppressionAnalysisProgress.result içinde (polling üzerinden) gelir.
type AnalysisResponse = { analysis_id: string }
type ControlItemTemplatesResponse = { data: FireSuppressionControlItemTemplate[] }
export type FireSuppressionAnalysisProgress = {
  status: 'running' | 'completed' | 'failed'
  current_stage: string
  current_label: string
  current_page: number | null
  total_pages?: number
  started_at?: string
  finished_at?: string | null
  error?: string
  result?: FireSuppressionReportAnalysisDraft & {
    _debug_ai_raw?: unknown
  }
  events: Array<{
    stage: string
    label: string
    status: 'running' | 'done' | 'error'
    at: string
    [key: string]: unknown
  }>
}

type ProgressResponse = { data: FireSuppressionAnalysisProgress }

// UI debug/telemetry için son analiz kimliği. Mevcut sayfa akışını değiştirmez.
export const activeFireSuppressionAnalysisId = ref<string | null>(null)
// Eşleştirme ekranındaki tesisat özeti için son tamamlanan analiz sonucu.
// Sayfa akışını değiştirmez; analiz başlarken temizlenir.
export const latestFireSuppressionAnalysisResult = ref<FireSuppressionReportAnalysisDraft | null>(null)

export const fireSuppressionReportApi = {
  list: (locationBusinessEntityId: number) => apiClient<ListResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports`),
  get: (reportId: number) => apiClient<ItemResponse>(`/api/fire-suppression-reports/${reportId}`),
  create: (locationBusinessEntityId: number, payload: FireSuppressionReportPayload) => {
    const form = new FormData()
    form.append('report_date', payload.report_date)
    if (payload.report_no) form.append('report_no', payload.report_no)
    if (payload.next_control_date) form.append('next_control_date', payload.next_control_date)
    if (payload.overall_result) form.append('overall_result', payload.overall_result)
    if (payload.inspection_company_name) form.append('inspection_company_name', payload.inspection_company_name)
    if (payload.notes) form.append('notes', payload.notes)
    form.append('file', payload.file)
    payload.covered_categories?.forEach((c, i) => form.append(`covered_categories[${i}]`, c))
    payload.covered_inventory_item_ids?.forEach((id, i) => form.append(`covered_inventory_item_ids[${i}]`, String(id)))
    payload.approved_new_categories?.forEach((c, i) => form.append(`approved_new_categories[${i}]`, c))
    if (payload.findings?.length) form.append('findings', JSON.stringify(payload.findings))
    if (payload.control_items?.length) form.append('control_items', JSON.stringify(payload.control_items))
    payload.additional_files?.forEach((entry, i) => {
      form.append(`additional_files[${i}][file]`, entry.file)
      form.append(`additional_files[${i}][type]`, entry.type)
      if (entry.description) form.append(`additional_files[${i}][description]`, entry.description)
    })
    return apiClient<ItemResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports`, { method: 'POST', body: form, timeout: 30000 })
  },
  remove: (reportId: number) => apiClient<MessageResponse>(`/api/fire-suppression-reports/${reportId}`, { method: 'DELETE' }),
  analyze: (locationBusinessEntityId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const analysisId = crypto.randomUUID()
    activeFireSuppressionAnalysisId.value = analysisId
    latestFireSuppressionAnalysisResult.value = null
    // Bu istek artık sadece dosyayı saklayıp işi kuyruğa atıyor (202
    // Accepted) — NVIDIA çağrısı beklenmiyor, o yüzden sınırsız timeout'a
    // gerek yok, tıpkı create() gibi kısa bir süre yeterli.
    return apiClient<AnalysisResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports/analyze`, {
      method: 'POST', body: form, timeout: 30000, headers: { 'X-Analysis-Id': analysisId },
    })
  },
  analysisProgress: async (analysisId: string) => {
    const response = await apiClient<ProgressResponse>(`/api/fire-suppression-analysis/${analysisId}/progress`, { method: 'GET', timeout: 10000 })

    if (response.data.status === 'completed' && response.data.result) {
      latestFireSuppressionAnalysisResult.value = response.data.result

      // GEÇİCİ DEBUG: normalize edilmeden önce Gemini'den gelen ham JSON.
      // UI/wizard state'ine dokunmadan sadece browser console'a basılır.
      console.log('🔥 GEMINI RAW AI JSON:', response.data.result._debug_ai_raw)
      console.log('🔥 NORMALIZED RESULT:', response.data.result)
    }

    return response
  },
  controlItemTemplates: (categories?: FireSuppressionCategory[]) => {
    const query = categories?.length ? `?${categories.map((c, i) => `categories[${i}]=${encodeURIComponent(c)}`).join('&')}` : ''
    return apiClient<ControlItemTemplatesResponse>(`/api/fire-suppression-control-item-templates${query}`)
  },
}
