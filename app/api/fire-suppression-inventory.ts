import { apiClient } from './client'
import type {
  FireSuppressionInventoryItem,
  FireSuppressionInventoryPayload,
  FireSuppressionInventorySummary,
} from '~/types/fire-suppression-inventory'

type ListResponse = { data: FireSuppressionInventoryItem[] }
type ItemResponse = { data: FireSuppressionInventoryItem }
type SummaryResponse = { data: FireSuppressionInventorySummary }
type MessageResponse = { message: string }

export const fireSuppressionInventoryApi = {
  list: (locationBusinessEntityId: number) =>
    apiClient<ListResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-inventory`),

  summary: (locationBusinessEntityId: number) =>
    apiClient<SummaryResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-inventory/summary`),

  create: (locationBusinessEntityId: number, payload: FireSuppressionInventoryPayload) =>
    apiClient<ItemResponse>(`/api/location-business-entities/${locationBusinessEntityId}/fire-suppression-inventory`, {
      method: 'POST',
      body: payload,
    }),

  update: (itemId: number, payload: Partial<FireSuppressionInventoryPayload>) =>
    apiClient<ItemResponse>(`/api/fire-suppression-inventory/${itemId}`, {
      method: 'PUT',
      body: payload,
    }),

  remove: (itemId: number) =>
    apiClient<MessageResponse>(`/api/fire-suppression-inventory/${itemId}`, {
      method: 'DELETE',
    }),
}
