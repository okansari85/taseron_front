import type { TenantOnboardingPayload, TenantOnboardingResponse } from '~/types/tenant'
import { apiClient } from './client'

export type TenantOnboardingApiResponse = {
  message: string
  data: TenantOnboardingResponse
}

export const tenantOnboardingApi = {
  create: (payload: TenantOnboardingPayload) =>
    apiClient<TenantOnboardingApiResponse>('/api/tenant-onboarding', {
      method: 'POST',
      body: payload,
    }),
}
