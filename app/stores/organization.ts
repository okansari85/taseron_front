import { defineStore } from 'pinia'
import type { Organization, OrganizationPayload } from '~/types/organization'
import { organizationApi } from '~/api/organization'

export const useOrganizationStore = defineStore('organization', () => {
  const organizations = ref<Organization[]>([])
  const currentOrganization = ref<Organization | null>(null)
  const loadedTenantId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)
  const pendingTenantRequests = new Map<number, Promise<Organization[]>>()

  const fetchOrganizations = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await organizationApi.list()
      organizations.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Organizasyon listesi alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchOrganizationsForTenant = async (tenantId: number, force = false) => {
    if (!force && loadedTenantId.value === tenantId) return organizations.value

    const pending = pendingTenantRequests.get(tenantId)
    if (!force && pending) return pending

    loading.value = true
    error.value = null

    const request = organizationApi.listForTenant(tenantId)
      .then(response => {
        organizations.value = response
        loadedTenantId.value = tenantId
        return response
      })
      .catch(err => {
        error.value = err instanceof Error ? err.message : 'Organizasyon listesi alınamadı.'
        throw err
      })
      .finally(() => {
        pendingTenantRequests.delete(tenantId)
        loading.value = false
      })

    pendingTenantRequests.set(tenantId, request)
    return request
  }

  const fetchOrganization = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await organizationApi.get(id)
      currentOrganization.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Organizasyon alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createOrganization = async (payload: OrganizationPayload) => {
    saving.value = true
    error.value = null
    try {
      const response = await organizationApi.create(payload)
      organizations.value.unshift(response)
      currentOrganization.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Organizasyon oluşturulamadı.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const createOrganizationForTenant = async (tenantId: number, payload: OrganizationPayload) => {
    saving.value = true
    error.value = null
    try {
      const response = await organizationApi.createForTenant(tenantId, payload)
      organizations.value.unshift(response)
      currentOrganization.value = response
      loadedTenantId.value = tenantId
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Organizasyon oluşturulamadı.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const updateOrganization = async (id: number, payload: Partial<OrganizationPayload>) => {
    saving.value = true
    error.value = null
    try {
      const response = await organizationApi.update(id, payload)
      const index = organizations.value.findIndex(item => item.id === id)
      if (index !== -1) organizations.value[index] = response
      if (currentOrganization.value?.id === id) currentOrganization.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Organizasyon güncellenemedi.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const deleteOrganization = async (id: number) => {
    deleting.value = true
    error.value = null
    try {
      await organizationApi.remove(id)
      organizations.value = organizations.value.filter(item => item.id !== id)
      if (currentOrganization.value?.id === id) currentOrganization.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Organizasyon silinemedi.'
      throw err
    } finally {
      deleting.value = false
    }
  }

  const groups = computed(() => organizations.value.filter(item => item.type === 'group'))
  const holdings = computed(() => organizations.value.filter(item => item.type === 'holding'))
  const companies = computed(() => organizations.value.filter(item => item.type === 'company'))

  return { organizations, currentOrganization, loadedTenantId, groups, holdings, companies, loading, saving, deleting, error, fetchOrganizations, fetchOrganizationsForTenant, fetchOrganization, createOrganization, createOrganizationForTenant, updateOrganization, deleteOrganization }
})
