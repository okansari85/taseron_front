import { defineStore } from 'pinia'
import type { Tenant, TenantOnboardingPayload } from '~/types/tenant'
import { tenantApi } from '~/api/tenant'
import { tenantOnboardingApi } from '~/api/tenant-onboarding'

export const useTenantStore = defineStore('tenant', () => {
  const tenants = ref<Tenant[]>([])
  const currentTenant = ref<Tenant | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  const fetchTenants = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await tenantApi.list()
      tenants.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Tenant listesi alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTenant = async (id: number) => {
    const cached = tenants.value.find(item => item.id === id)
    if (cached) {
      currentTenant.value = cached
      return cached
    }

    if (currentTenant.value?.id === id) return currentTenant.value

    loading.value = true
    error.value = null
    try {
      const response = await tenantApi.get(id)
      const tenant = response.data
      const index = tenants.value.findIndex(item => item.id === id)
      if (index === -1) tenants.value.push(tenant)
      else tenants.value[index] = tenant
      currentTenant.value = tenant
      return tenant
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Tenant alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTenant = async (payload: Record<string, unknown>) => {
    saving.value = true
    error.value = null
    try {
      const response = await tenantApi.create(payload)
      tenants.value.unshift(response.data)
      currentTenant.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Tenant oluşturulamadı.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const onboardTenant = async (payload: TenantOnboardingPayload) => {
    saving.value = true
    error.value = null
    try {
      const response = await tenantOnboardingApi.create(payload)
      const tenant = response.data.tenant
      const index = tenants.value.findIndex(item => item.id === tenant.id)
      if (index === -1) tenants.value.unshift(tenant)
      else tenants.value[index] = tenant
      currentTenant.value = tenant
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Tenant onboarding başarısız oldu.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const updateTenant = async (id: number, payload: Record<string, unknown>) => {
    saving.value = true
    error.value = null
    try {
      const response = await tenantApi.update(id, payload)
      const index = tenants.value.findIndex(item => item.id === id)
      if (index !== -1) tenants.value[index] = response.data
      if (currentTenant.value?.id === id) currentTenant.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Tenant güncellenemedi.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const deleteTenant = async (id: number) => {
    deleting.value = true
    error.value = null
    try {
      await tenantApi.remove(id)
      tenants.value = tenants.value.filter(item => item.id !== id)
      if (currentTenant.value?.id === id) currentTenant.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Tenant silinemedi.'
      throw err
    } finally {
      deleting.value = false
    }
  }

  return {
    tenants,
    currentTenant,
    loading,
    saving,
    deleting,
    error,
    fetchTenants,
    fetchTenant,
    createTenant,
    onboardTenant,
    updateTenant,
    deleteTenant,
  }
})
