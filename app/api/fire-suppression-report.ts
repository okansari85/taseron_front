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
    payload.findings?.forEach((finding, i) => {
      if (finding.category) form.append(`findings[${i}][category]`, finding.category)
      if (finding.control_item) form.append(`findings[${i}][control_item]`, finding.control_item)
      form.append(`findings[${i}][description]`, finding.description)
      form.append(`findings[${i}][scope]`, finding.scope)
      if (finding.area_note) form.append(`findings[${i}][area_note]`, finding.area_note)
      finding.affected_item_ids?.forEach((id, j) => form.append(`findings[${i}][affected_item_ids][${j}]`, String(id)))
    })
    payload.control_items?.forEach((item, i) => {
      if (item.template_id) form.append(`control_items[${i}][template_id]`, String(item.template_id))
      if (item.category) form.append(`control_items[${i}][category]`, item.category)
      if (item.code) form.append(`control_items[${i}][code]`, item.code)
      if (item.section) form.append(`control_items[${i}][section]`, item.section)
      form.append(`control_items[${i}][title]`, item.title)
      form.append(`control_items[${i}][status]`, item.status)
      if (item.description) form.append(`control_items[${i}][description]`, item.description)
    })
    payload.additional_files?.forEach((entry, i) => {
      form.append(`additional_files[${i}][file]`, entry.file)
      form.append(`additional_files[${i}][type]`, entry.type)
      if (entry.description) form.append(`additional_files[${i}][description]`, entry.description)
    })
    return apiClient<ItemResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports`, {
      method: 'POST',
      body: form,
    })
  },

  remove: (reportId: number) =>
    apiClient<MessageResponse>(`/api/fire-suppression-reports/${reportId}`, {
      method: 'DELETE',
    }),

  analyze: (locationBusinessEntityId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient<AnalysisResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-reports/analyze`, {
      method: 'POST',
      body: form,
    })
  },

  controlItemTemplates: (categories?: FireSuppressionCategory[]) => {
    const query = categories?.length ? `?${categories.map((c, i) => `categories[${i}]=${encodeURIComponent(c)}`).join('&')}` : ''
    return apiClient<ControlItemTemplatesResponse>(`/api/fire-suppression-control-item-templates${query}`)
  },
}
