import type { TenantOnboardingPayload, TenantOnboardingResponse } from '~/types/tenant'
import { apiClient } from './client'

export type TenantOnboardingApiResponse = {
  message: string
  data: TenantOnboardingResponse
}

const appendValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null || value === '') return

  if (value instanceof File) {
    formData.append(key, value)
    return
  }

  formData.append(key, String(value))
}

export const tenantOnboardingApi = {
  create: (payload: TenantOnboardingPayload) => {
    const formData = new FormData()

    appendValue(formData, 'onboarding_type', payload.onboarding_type)
    appendValue(formData, 'tenant[name]', payload.tenant.name)
    appendValue(formData, 'tenant[slug]', payload.tenant.slug)
    appendValue(formData, 'tenant[status]', payload.tenant.status === 'active' ? '1' : '0')
    appendValue(formData, 'organization[name]', payload.organization.name)

    if (payload.company) {
      appendValue(formData, 'company[name]', payload.company.name)
      appendValue(formData, 'company[company_type]', payload.company.company_type)
    }

    if (payload.location) {
      appendValue(formData, 'location[name]', payload.location.name)
    }

    appendValue(formData, 'logo', payload.logo)

    return apiClient<TenantOnboardingApiResponse>('/api/tenant-onboarding', {
      method: 'POST',
      body: formData,
    })
  },
}
