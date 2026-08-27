import { defineStore } from 'pinia'
import type { Organization, OrganizationPayload } from '~/types/organization'
import { organizationApi } from '~/api/organization'

export const useOrganizationStore = defineStore('organization', () => {
  const route = useRoute()
  const organizations = ref<Organization[]>([])
  const currentOrganization = ref<Organization | null>(null)
  const loadedTenantId = ref<number | null>(null)
  const tenantOrganizationCache = new Map<number, Organization[]>()
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)
  const pendingTenantRequests = new Map<number, Promise<Organization[]>>()

  const routeTenantId = computed(() => {
    const value = route.params.tenantId
    const id = Number(Array.isArray(value) ? value[0] : value)
    return Number.isInteger(id) && id > 0 ? id : null
  })

  const fetchOrganizations = async () => {
    // Tenant workspace içindeysek eski çağrı da aynı tenant-aware akışa girer.
    // Böylece farklı componentler farklı methodları çağırsa bile ikinci request oluşmaz.
    if (routeTenantId.value !== null) {
      return fetchOrganizationsForTenant(routeTenantId.value)
    }

    loading.value = true
    error.value = null
    try {
      const response = await organizationApi.list()
      organizations.value = response
      loadedTenantId.value = null
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Organizasyon listesi alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchOrganizationsForTenant = async (tenantId: number, force = false) => {
    if (!tenantId || !Number.isInteger(tenantId)) {
      throw new Error('Geçerli bir tenant ID gerekli.')
    }

    if (!force && tenantOrganizationCache.has(tenantId)) {
      const cached = tenantOrganizationCache.get(tenantId) ?? []
      organizations.value = cached
      loadedTenantId.value = tenantId
      return cached
    }

    const pending = pendingTenantRequests.get(tenantId)
    if (!force && pending) return pending

    loading.value = true
    error.value = null

    const request = organizationApi.listForTenant(tenantId)
      .then(response => {
        tenantOrganizationCache.set(tenantId, response)
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
      const cached = tenantOrganizationCache.get(tenantId) ?? []
      const next = [response, ...cached.filter(item => item.id !== response.id)]
      tenantOrganizationCache.set(tenantId, next)
      organizations.value = next
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
      if (loadedTenantId.value !== null) {
        const cached = tenantOrganizationCache.get(loadedTenantId.value) ?? []
        const cachedIndex = cached.findIndex(item => item.id === id)
        if (cachedIndex !== -1) cached[cachedIndex] = response
      }
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
      if (loadedTenantId.value !== null) {
        const cached = tenantOrganizationCache.get(loadedTenantId.value) ?? []
        tenantOrganizationCache.set(loadedTenantId.value, cached.filter(item => item.id !== id))
      }
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
