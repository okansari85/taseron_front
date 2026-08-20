import type { FetchOptions } from 'ofetch'

export const apiClient = <T>(path: string, options: FetchOptions<'json'> = {}) => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('auth_token')

  const headers = new Headers(options.headers as HeadersInit | undefined)

  if (token.value) {
    headers.set('Authorization', `Bearer ${token.value}`)
  }

  headers.set('Accept', 'application/json')

  return $fetch<T>(path, {
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',
    ...options,
    headers,
  })
}
