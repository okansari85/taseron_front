import { apiClient } from './client'
import type { WorkRequestItem, WorkRequestPayload, WorkRequestStatus } from '~/types/work-request'

type WorkRequestListResponse = { data: WorkRequestItem[] }
type WorkRequestResponse = { message: string; data: WorkRequestItem }
type MessageResponse = { message: string }

export const workRequestApi = {
  list: (contractorId?: number) =>
    apiClient<WorkRequestListResponse>(
      contractorId ? `/api/work-requests?contractor_id=${contractorId}` : '/api/work-requests',
    ),

  create: (payload: WorkRequestPayload) =>
    apiClient<WorkRequestResponse>('/api/work-requests', {
      method: 'POST',
      body: payload,
    }),

  updateStatus: (id: number, status: WorkRequestStatus) =>
    apiClient<WorkRequestResponse>(`/api/work-requests/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  remove: (id: number) =>
    apiClient<MessageResponse>(`/api/work-requests/${id}`, {
      method: 'DELETE',
    }),

  acceptProposedDate: (id: number) =>
    apiClient<WorkRequestResponse>(`/api/work-requests/${id}/accept-proposed-date`, {
      method: 'PATCH',
    }),

  // Taşeron portalı - kullanıcı sadece kendi taşeronuna açılan işleri görür.
  myRequests: () => apiClient<WorkRequestListResponse>('/api/my/work-requests'),

  proposeDate: (id: number, proposedDate: string) =>
    apiClient<WorkRequestResponse>(`/api/my/work-requests/${id}/propose-date`, {
      method: 'PATCH',
      body: { proposed_date: proposedDate },
    }),

  // Operasyon portalı - iş talebi onayı taşeron ile operation rolü arasındadır (İSG değil).
  operation: {
    list: () => apiClient<WorkRequestListResponse>('/api/operation/work-requests'),

    updateStatus: (id: number, status: WorkRequestStatus) =>
      apiClient<WorkRequestResponse>(`/api/operation/work-requests/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
  },
}
