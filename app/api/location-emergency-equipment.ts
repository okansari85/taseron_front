import { apiClient } from './client'
import type {
  LocationEmergencyEquipmentItem,
  LocationEmergencyEquipmentPayload,
  EmergencyEquipmentInspectionRecord,
  EmergencyEquipmentInspectionPayload,
  EmergencyEquipmentInspectionUpdatePayload,
} from '~/types/location-emergency-equipment'

type EquipmentListResponse = { data: LocationEmergencyEquipmentItem[] }
type EquipmentResponse = { data: LocationEmergencyEquipmentItem }
type InspectionListResponse = { data: EmergencyEquipmentInspectionRecord[] }
type InspectionResponse = { data: EmergencyEquipmentInspectionRecord }
type MessageResponse = { message: string }

export const locationEmergencyEquipmentApi = {
  list: (locationBusinessEntityId: number) =>
    apiClient<EquipmentListResponse>(`/api/location-business-entities/${locationBusinessEntityId}/emergency-equipment`),

  create: (locationBusinessEntityId: number, payload: LocationEmergencyEquipmentPayload) =>
    apiClient<EquipmentResponse>(`/api/location-business-entities/${locationBusinessEntityId}/emergency-equipment`, {
      method: 'POST',
      body: payload,
    }),

  update: (equipmentId: number, payload: Partial<LocationEmergencyEquipmentPayload>) =>
    apiClient<EquipmentResponse>(`/api/emergency-equipment/${equipmentId}`, {
      method: 'PUT',
      body: payload,
    }),

  remove: (equipmentId: number) =>
    apiClient<MessageResponse>(`/api/emergency-equipment/${equipmentId}`, {
      method: 'DELETE',
    }),

  inspections: (equipmentId: number) =>
    apiClient<InspectionListResponse>(`/api/emergency-equipment/${equipmentId}/inspections`),

  createInspection: (equipmentId: number, payload: EmergencyEquipmentInspectionPayload) => {
    const items = payload.items ?? []
    const hasItemPhotos = items.some(item => item.photo instanceof File)
    const hasGeneralPhotos = Array.isArray(payload.photos) && payload.photos.length > 0

    if (!hasItemPhotos && !hasGeneralPhotos) {
      const body = {
        items: items.map(item => ({ checklist_item_id: item.checklist_item_id, note: item.note ?? null })),
        notes: payload.notes ?? null,
        inspected_at: payload.inspected_at ?? null,
        inspected_by_user_id: payload.inspected_by_user_id ?? null,
        inspected_by_name: payload.inspected_by_name ?? null,
      }
      return apiClient<InspectionResponse>(`/api/emergency-equipment/${equipmentId}/inspections`, { method: 'POST', body })
    }

    const form = new FormData()
    items.forEach((item, index) => {
      form.append(`items[${index}][checklist_item_id]`, String(item.checklist_item_id))
      if (item.note) form.append(`items[${index}][note]`, item.note)
      if (item.photo instanceof File) form.append(`items[${index}][photo]`, item.photo)
    })
    if (payload.notes) form.append('notes', payload.notes)
    if (payload.inspected_at) form.append('inspected_at', payload.inspected_at)
    if (payload.inspected_by_user_id) form.append('inspected_by_user_id', String(payload.inspected_by_user_id))
    if (payload.inspected_by_name) form.append('inspected_by_name', payload.inspected_by_name)
    payload.photos?.forEach(file => form.append('photos[]', file))
    return apiClient<InspectionResponse>(`/api/emergency-equipment/${equipmentId}/inspections`, { method: 'POST', body: form })
  },

  updateInspection: (inspectionId: number, payload: EmergencyEquipmentInspectionUpdatePayload) => {
    const items = payload.items ?? []
    const hasItemPhotos = items.some(item => item.photo instanceof File || item.remove_photo)
    const hasGeneralPhotos = Array.isArray(payload.photos) && payload.photos.length > 0
    const hasRemovePhotoIds = Array.isArray(payload.remove_photo_ids) && payload.remove_photo_ids.length > 0

    if (!hasItemPhotos && !hasGeneralPhotos && !hasRemovePhotoIds) {
      const body = {
        items: items.map(item => ({ id: item.id ?? null, checklist_item_id: item.checklist_item_id, note: item.note ?? null })),
        notes: payload.notes ?? null,
        inspected_at: payload.inspected_at ?? null,
      }
      return apiClient<InspectionResponse>(`/api/emergency-equipment-inspections/${inspectionId}`, { method: 'PUT', body })
    }

    const form = new FormData()
    form.append('_method', 'PUT')
    items.forEach((item, index) => {
      if (item.id) form.append(`items[${index}][id]`, String(item.id))
      form.append(`items[${index}][checklist_item_id]`, String(item.checklist_item_id))
      if (item.note) form.append(`items[${index}][note]`, item.note)
      if (item.photo instanceof File) form.append(`items[${index}][photo]`, item.photo)
      if (item.remove_photo) form.append(`items[${index}][remove_photo]`, '1')
    })
    if (payload.notes) form.append('notes', payload.notes)
    if (payload.inspected_at) form.append('inspected_at', payload.inspected_at)
    payload.remove_photo_ids?.forEach(id => form.append('remove_photo_ids[]', String(id)))
    payload.photos?.forEach(file => form.append('photos[]', file))
    return apiClient<InspectionResponse>(`/api/emergency-equipment-inspections/${inspectionId}`, { method: 'POST', body: form })
  },
}
