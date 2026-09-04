import { apiClient } from '~/api/client'
import { userAuthorizationApi, type ImpersonationResponse } from '~/api/user-authorization'
import type { AuthUser } from './useAuth'

const normalizeRole = (role: string) => role.trim().toLocaleLowerCase('tr-TR').replace(/[_\s-]/g, '')

export const useUserImpersonation = () => {
  const auth = useAuth()
  const originalToken = useCookie<string | null>('super_admin_auth_token', {
    default: () => null,
    sameSite: 'lax',
    secure: !import.meta.dev,
    watch: true,
  })
  const originalUser = useCookie<AuthUser | null>('super_admin_auth_user', {
    default: () => null,
    sameSite: 'lax',
    secure: !import.meta.dev,
    watch: true,
  })
  const returnPath = useCookie<string | null>('impersonation_return_path', {
    default: () => null,
    sameSite: 'lax',
    secure: !import.meta.dev,
    watch: true,
  })
  const loading = ref(false)
  const isImpersonating = computed(() => Boolean(originalToken.value))

  const start = async (userId: number, path: string): Promise<ImpersonationResponse> => {
    if (!auth.token.value || loading.value) throw new Error('Aktif oturum bulunamadı.')

    loading.value = true
    try {
      const response = await userAuthorizationApi.impersonate(userId)
      originalToken.value = auth.token.value
      originalUser.value = auth.user.value
      returnPath.value = path
      auth.token.value = response.token
      auth.user.value = response.user
      auth.initialized.value = true
      return response
    } finally {
      loading.value = false
    }
  }

  const stop = async () => {
    if (!originalToken.value || loading.value) return null

    const savedToken = originalToken.value
    const savedUser = originalUser.value
    const savedPath = returnPath.value
    loading.value = true
    try {
      try {
        if (auth.token.value) await apiClient('/api/logout', { method: 'POST' })
      } catch (error) {
        console.warn('Impersonation token could not be revoked.', error)
      }

      auth.token.value = savedToken
      auth.user.value = savedUser
      auth.initialized.value = true
      originalToken.value = null
      originalUser.value = null
      returnPath.value = null
      return savedPath
    } finally {
      loading.value = false
    }
  }

  const workspaceForRoles = (roles: string[]) => {
    if (roles.some(role => normalizeRole(role).includes('guvenlik') || normalizeRole(role).includes('security'))) return 'security' as const
    if (roles.some(role => normalizeRole(role).includes('taseron') || normalizeRole(role).includes('contractor'))) return 'contractor' as const
    return 'admin' as const
  }

  return { loading, isImpersonating, start, stop, workspaceForRoles }
}
