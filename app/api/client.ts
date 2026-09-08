import type { FetchOptions } from 'ofetch'

const isGlobalApiPath = (path: string) =>
  path === '/api/login' ||
  path === '/api/logout' ||
  path === '/api/user' ||
  path === '/api/tenant-onboarding' ||
  path === '/api/tenants' ||
  path.startsWith('/api/tenants/')

export const apiClient = <T>(path: string, options: FetchOptions<'json'> = {}) => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('auth_token')
  const tenantContext = useTenantRequestContext()
  const body = options.body

  const headers = new Headers(options.headers as HeadersInit | undefined)

  if (token.value) {
    headers.set('Authorization', `Bearer ${token.value}`)
  }

  // Explicit tenant headers always win. For tenant-scoped API calls, use the
  // route context initialized by global middleware before pages/layouts run.
  // This avoids both stale Pinia tenant state on refresh and useRoute() calls
  // from inside middleware-driven requests.
  if (!headers.has('X-Tenant-ID') && !isGlobalApiPath(path)) {
    const tenantId = tenantContext.tenantId.value

    if (tenantId) {
      headers.set('X-Tenant-ID', String(tenantId))
    }
  }

  // Header'daki aktif çalışma bağlamı (Organizasyon/Marka + Lokasyon) — sadece
  // seçili bir şey varsa eklenir; backend bunu opsiyonel bir filtre olarak
  // okur (bkz. ResolveWorkspaceContext), göndermeyen çağrılar etkilenmez.
  if (!isGlobalApiPath(path)) {
    const workspaceContext = useWorkspaceContextStore()

    if (!headers.has('X-Organization-Id') && workspaceContext.selectedOrganizationId !== null) {
      headers.set('X-Organization-Id', String(workspaceContext.selectedOrganizationId))
      headers.set('X-Organization-Kind', workspaceContext.selectedOrganizationKind)
    }

    if (!headers.has('X-Location-Id') && workspaceContext.selectedLocationId !== null) {
      headers.set('X-Location-Id', String(workspaceContext.selectedLocationId))
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
