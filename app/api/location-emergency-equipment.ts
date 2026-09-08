import { apiClient } from './client'
import type {
  LocationEmergencyEquipmentItem,
  LocationEmergencyEquipmentPayload,
  EmergencyEquipmentInspectionRecord,
  EmergencyEquipmentInspectionPayload,
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

  createInspection: (equipmentId: number, payload: EmergencyEquipmentInspectionPayload) =>
    apiClient<InspectionResponse>(`/api/emergency-equipment/${equipmentId}/inspections`, {
      method: 'POST',
      body: payload,
    }),
}
