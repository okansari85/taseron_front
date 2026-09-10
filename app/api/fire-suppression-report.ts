import { apiClient } from './client'
import type { FireSuppressionCategory } from '~/types/fire-suppression-inventory'
import type { FireSuppressionControlItemTemplate, FireSuppressionReport, FireSuppressionReportAnalysisDraft, FireSuppressionReportPayload } from '~/types/fire-suppression-report'

type ListResponse = { data: FireSuppressionReport[] }
type ItemResponse = { data: FireSuppressionReport }
type MessageResponse = { message: string }
type AnalysisResponse = { data: FireSuppressionReportAnalysisDraft }
type ControlItemTemplatesResponse = { data: FireSuppressionControlItemTemplate[] }

export const fireSuppressionReportApi = {
  list: (locationBusinessEntityId: number) =>
    apiClient<ListResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports`),

  get: (reportId: number) =>
    apiClient<ItemResponse>(`/api/fire-suppression-reports/${reportId}`),

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
    // findings/control_items TEK bir JSON alanı olarak gönderiliyor —
    // çok sayfalı raporlarda (örn. 20 ekipman x ~14 madde = 280 satır)
    // her alanı ayrı bir form key'i (`control_items[123][title]` gibi)
    // yapmak PHP'nin max_input_vars (varsayılan 1000) limitini kolayca
    // aşıp sessizce veri kaybına/422'ye yol açıyordu. Backend
    // prepareForValidation()'da bu alanları JSON.decode ediyor.
    if (payload.findings?.length) form.append('findings', JSON.stringify(payload.findings))
    if (payload.control_items?.length) form.append('control_items', JSON.stringify(payload.control_items))
    payload.additional_files?.forEach((entry, i) => {
      form.append(`additional_files[${i}][file]`, entry.file)
      form.append(`additional_files[${i}][type]`, entry.type)
      if (entry.description) form.append(`additional_files[${i}][description]`, entry.description)
    })
    return apiClient<ItemResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports`, {
      method: 'POST',
      body: form,
      timeout: 30000,
    })
  },

  remove: (reportId: number) =>
    apiClient<MessageResponse>(`/api/fire-suppression-reports/${reportId}`, {
      method: 'DELETE',
    }),

  analyze: (locationBusinessEntityId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    // PDF metin çıkarma + AI (NVIDIA NIM) çağrısının süresi öngörülemiyor —
    // timeout verilmezse ofetch/tarayıcı isteği süresiz bekler.
    return apiClient<AnalysisResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports/analyze`, {
      method: 'POST',
      body: form,
      timeout: undefined,
    })
  },

  controlItemTemplates: (categories?: FireSuppressionCategory[]) => {
    const query = categories?.length ? `?${categories.map((c, i) => `categories[${i}]=${encodeURIComponent(c)}`).join('&')}` : ''
    return apiClient<ControlItemTemplatesResponse>(`/api/fire-suppression-control-item-templates${query}`)
  },
}
