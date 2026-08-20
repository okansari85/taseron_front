import type { FetchOptions } from 'ofetch'

export const apiClient = <T>(path: string, options: FetchOptions<'json'> = {}) => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('auth_token')
  const body = options.body

  const headers = new Headers(options.headers as HeadersInit | undefined)

  if (token.value) {
    headers.set('Authorization', `Bearer ${token.value}`)
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
