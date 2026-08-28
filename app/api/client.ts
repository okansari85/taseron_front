import type { FetchOptions } from 'ofetch'

export const apiClient = <T>(path: string, options: FetchOptions<'json'> = {}) => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('auth_token')
  const tenantStore = useTenantStore()
  const body = options.body

  const headers = new Headers(options.headers as HeadersInit | undefined)

  if (token.value) {
    headers.set('Authorization', `Bearer ${token.value}`)
  }

  // Prefer an explicitly supplied tenant header. Otherwise use the tenant
  // currently loaded in the tenant store. Do not use useRoute() here because
  // this client is also called from global middleware.
  if (!headers.has('X-Tenant-ID')) {
    const tenantId = tenantStore.currentTenant?.id

    if (tenantId && Number.isInteger(Number(tenantId))) {
      headers.set('X-Tenant-ID', String(tenantId))
    } else {
      headers.delete('X-Tenant-ID')
    }
  }

  headers.set('Accept', 'application/json')

  // Let the browser set the multipart boundary for FormData requests.
  // Setting application/json here would prevent Laravel from parsing the form fields.
  if (!(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  } else {
    headers.delete('Content-Type')
  }

  return $fetch<T>(path, {
    baseURL: config.public.apiBaseUrl,
    credentials: 'omit',
    timeout: 10000,
    ...options,
    headers,
  })
}
