import { apiClient } from './client'
import type { FieldFindingPayload, FieldFindingRecord, FieldFindingUpdatePayload } from '~/types/field-finding'

type FindingListResponse = { data: FieldFindingRecord[] }
type FindingResponse = { data: FieldFindingRecord }
type MessageResponse = { message: string }

const buildForm = (payload: Record<string, any>) => {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (key === 'photos' && Array.isArray(value)) { value.forEach((f: File) => form.append('photos[]', f)); return }
    if (key === 'remove_photo_ids' && Array.isArray(value)) { value.forEach((id: number) => form.append('remove_photo_ids[]', String(id))); return }
    form.append(key, String(value))
  })
  return form
}

export const fieldFindingApi = {
  list: (locationBusinessEntityId: number) =>
    apiClient<FindingListResponse>(`/api/location-business-entities/${locationBusinessEntityId}/field-findings`),

  create: (locationBusinessEntityId: number, payload: FieldFindingPayload) =>
    apiClient<FindingResponse>(`/api/location-business-entities/${locationBusinessEntityId}/field-findings`, {
      method: 'POST',
      body: buildForm(payload),
    }),

  update: (findingId: number, payload: FieldFindingUpdatePayload) => {
    const form = buildForm(payload)
    form.append('_method', 'PUT')
    return apiClient<FindingResponse>(`/api/field-findings/${findingId}`, { method: 'POST', body: form })
  },

  remove: (findingId: number) =>
    apiClient<MessageResponse>(`/api/field-findings/${findingId}`, { method: 'DELETE' }),
}
