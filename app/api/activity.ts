import type { Activity, ActivityPayload, ActivityDocumentType, ActivityDocumentTypePayload, DocumentTarget } from '~/types/activity'
import { apiClient } from './client'

type ActivityListResponse = { data: Activity[] }
type ActivityResponse = { data: Activity }
type ActivityDocumentTypeListResponse = { data: ActivityDocumentType[] }
type ActivityDocumentTypeResponse = { data: ActivityDocumentType }
type MessageResponse = { message: string }

export const activityApi = {
  list: () => apiClient<ActivityListResponse>('/api/activities'),

  get: (id: number) => apiClient<ActivityResponse>(`/api/activities/${id}`),

  create: (payload: ActivityPayload) =>
    apiClient<ActivityResponse>('/api/activities', {
      method: 'POST',
      body: payload,
    }),

  update: (id: number, payload: Partial<ActivityPayload>) =>
    apiClient<ActivityResponse>(`/api/activities/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  remove: (id: number) =>
    apiClient<MessageResponse>(`/api/activities/${id}`, {
      method: 'DELETE',
    }),

  documentTypes: (activityId: number, target?: DocumentTarget) =>
    apiClient<ActivityDocumentTypeListResponse>(
      `/api/activities/${activityId}/document-types${target ? `?target=${target}` : ''}`,
    ),

  addDocumentType: (activityId: number, payload: ActivityDocumentTypePayload) =>
    apiClient<ActivityDocumentTypeResponse>(`/api/activities/${activityId}/document-types`, {
      method: 'POST',
      body: payload,
    }),

  updateDocumentType: (
    activityId: number,
    itemId: number,
    payload: Partial<Omit<ActivityDocumentTypePayload, 'target' | 'type'>>,
  ) =>
    apiClient<ActivityDocumentTypeResponse>(`/api/activities/${activityId}/document-types/${itemId}`, {
      method: 'PUT',
      body: payload,
    }),

  removeDocumentType: (activityId: number, itemId: number) =>
    apiClient<MessageResponse>(`/api/activities/${activityId}/document-types/${itemId}`, {
      method: 'DELETE',
    }),
}
