import type { FetchOptions } from 'ofetch'

export const apiClient = <T>(path: string, options: FetchOptions<'json'> = {}) => {
  const config = useRuntimeConfig()

  return $fetch<T>(path, {
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',
    ...options,
  })
}
