import type {
  EmergencyEquipmentType,
  EmergencyEquipmentTypePayload,
  EmergencyEquipmentChecklistItem,
  EmergencyEquipmentChecklistItemPayload,
  EmergencyEquipmentTypeTipOption,
  EmergencyEquipmentTypeTipOptionPayload,
} from '~/types/emergency-equipment'
import { apiClient } from './client'

type EquipmentTypeListResponse = { data: EmergencyEquipmentType[] }
type EquipmentTypeResponse = { data: EmergencyEquipmentType }
type ChecklistItemListResponse = { data: EmergencyEquipmentChecklistItem[] }
type ChecklistItemResponse = { data: EmergencyEquipmentChecklistItem }
type TipOptionListResponse = { data: EmergencyEquipmentTypeTipOption[] }
type TipOptionResponse = { data: EmergencyEquipmentTypeTipOption }
type MessageResponse = { message: string }

export const emergencyEquipmentTypeApi = {
  list: () => apiClient<EquipmentTypeListResponse>('/api/emergency-equipment-types'),

  get: (id: number) => apiClient<EquipmentTypeResponse>(`/api/emergency-equipment-types/${id}`),

  create: (payload: EmergencyEquipmentTypePayload) =>
    apiClient<EquipmentTypeResponse>('/api/emergency-equipment-types', {
      method: 'POST',
      body: payload,
    }),

  update: (id: number, payload: Partial<EmergencyEquipmentTypePayload>) =>
    apiClient<EquipmentTypeResponse>(`/api/emergency-equipment-types/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  remove: (id: number) =>
    apiClient<MessageResponse>(`/api/emergency-equipment-types/${id}`, {
      method: 'DELETE',
    }),

  checklistItems: (equipmentTypeId: number) =>
    apiClient<ChecklistItemListResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/checklist-items`),

  addChecklistItem: (equipmentTypeId: number, payload: EmergencyEquipmentChecklistItemPayload) =>
    apiClient<ChecklistItemResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/checklist-items`, {
      method: 'POST',
      body: payload,
    }),

  updateChecklistItem: (equipmentTypeId: number, itemId: number, payload: Partial<EmergencyEquipmentChecklistItemPayload>) =>
    apiClient<ChecklistItemResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/checklist-items/${itemId}`, {
      method: 'PUT',
      body: payload,
    }),

  removeChecklistItem: (equipmentTypeId: number, itemId: number) =>
    apiClient<MessageResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/checklist-items/${itemId}`, {
      method: 'DELETE',
    }),

  excludeChecklistItem: (equipmentTypeId: number, itemId: number) =>
    apiClient<MessageResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/checklist-exclusions/${itemId}`, {
      method: 'POST',
    }),

  includeChecklistItem: (equipmentTypeId: number, itemId: number) =>
    apiClient<MessageResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/checklist-exclusions/${itemId}`, {
      method: 'DELETE',
    }),

  tipOptions: (equipmentTypeId: number) =>
    apiClient<TipOptionListResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/tip-options`),

  addTipOption: (equipmentTypeId: number, payload: EmergencyEquipmentTypeTipOptionPayload) =>
    apiClient<TipOptionResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/tip-options`, {
      method: 'POST',
      body: payload,
    }),

  removeTipOption: (equipmentTypeId: number, tipOptionId: number) =>
    apiClient<MessageResponse>(`/api/emergency-equipment-types/${equipmentTypeId}/tip-options/${tipOptionId}`, {
      method: 'DELETE',
    }),
}
