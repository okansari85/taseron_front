import { apiClient } from './client'
import type {
  YscAnnualControlAnalysisDraft,
  YscAnnualControlFromAnalysisPayload,
  YscAnnualControlPayload,
  YscAnnualControlReport,
} from '~/types/ysc-annual-control'

type ListResponse = { data: YscAnnualControlReport[] }
type ItemResponse = { data: YscAnnualControlReport }
type MessageResponse = { message: string }
type AnalysisResponse = { data: YscAnnualControlAnalysisDraft }

export const emergencyEquipmentAnnualControlApi = {
  list: (locationBusinessEntityId: number) =>
    apiClient<ListResponse>(`/api/location-business-entities/${locationBusinessEntityId}/emergency-equipment-annual-controls`),

  get: (reportId: number) =>
    apiClient<ItemResponse>(`/api/emergency-equipment-annual-controls/${reportId}`),

  create: (locationBusinessEntityId: number, payload: YscAnnualControlPayload) => {
    const form = new FormData()
    form.append('control_date', payload.control_date)
    if (payload.next_control_date) form.append('next_control_date', payload.next_control_date)
    if (payload.result) form.append('result', payload.result)
    if (payload.company_name) form.append('company_name', payload.company_name)
    if (payload.notes) form.append('notes', payload.notes)
    form.append('file', payload.file)
    payload.equipment?.forEach((eq, i) => {
      form.append(`equipment[${i}][id]`, String(eq.id))
      if (eq.result) form.append(`equipment[${i}][result]`, eq.result)
      if (eq.note) form.append(`equipment[${i}][note]`, eq.note)
    })
    return apiClient<ItemResponse>(`/api/location-business-entities/${locationBusinessEntityId}/emergency-equipment-annual-controls`, {
      method: 'POST',
      body: form,
      timeout: 30000,
    })
  },

  // Tek upload akışının (fire-suppression) rapor tipi "ysc" olarak
  // sınıflandığında "Kaydet" bu endpoint'e gider - equipment/control_items
  // eskisi gibi ayrı form field'ları değil, StoreFireSuppressionReportRequest
  // ile AYNI konvansiyonla (yüzlerce satırı max_input_vars'ı aşmadan
  // taşımak için) tek birer JSON string olarak gönderilir.
  createFromAnalysis: (locationBusinessEntityId: number, payload: YscAnnualControlFromAnalysisPayload) => {
    const form = new FormData()
    form.append('control_date', payload.control_date)
    if (payload.next_control_date) form.append('next_control_date', payload.next_control_date)
    if (payload.result) form.append('result', payload.result)
    if (payload.company_name) form.append('company_name', payload.company_name)
    if (payload.notes) form.append('notes', payload.notes)
    if (payload.file) form.append('file', payload.file)
    else if (payload.fixtureId) form.append('fixture_id', payload.fixtureId)
    form.append('equipment', JSON.stringify(payload.equipment))
    form.append('control_items', JSON.stringify(payload.control_items))
    return apiClient<ItemResponse>(`/api/location-business-entities/${locationBusinessEntityId}/emergency-equipment-annual-controls/from-analysis`, {
      method: 'POST',
      body: form,
      timeout: 30000,
    })
  },

  remove: (reportId: number) =>
    apiClient<MessageResponse>(`/api/emergency-equipment-annual-controls/${reportId}`, {
      method: 'DELETE',
    }),

  analyze: (locationBusinessEntityId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    // PDF metin çıkarma + AI (NVIDIA NIM) çağrısının süresi öngörülemiyor —
    // timeout verilmezse ofetch/tarayıcı isteği süresiz bekler.
    return apiClient<AnalysisResponse>(`/api/location-business-entities/${locationBusinessEntityId}/emergency-equipment-annual-controls/analyze`, {
      method: 'POST',
      body: form,
      timeout: undefined,
    })
  },
}
