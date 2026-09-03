import type { AuthorizedUser } from '~/api/user-authorization'

export type PreviewWorkspace = 'admin' | 'contractor' | 'security'

const normalizeRole = (role: string) => role.trim().toLocaleLowerCase('tr-TR').replace(/_/g, '-').replace(/\s+/g, '-')

const workspaceForUser = (user: AuthorizedUser): PreviewWorkspace => {
  const roles = (user.roles ?? []).map(role => normalizeRole(role.name))
  const joined = roles.join(' ')

  if (joined.includes('security') || joined.includes('güvenlik')) return 'security'
  if (joined.includes('contractor') || joined.includes('taşeron') || joined.includes('taseron')) return 'contractor'
  return 'admin'
}

export const useUserPreview = () => {
  const previewUser = useState<AuthorizedUser | null>('preview_user', () => null)
  const users = useState<AuthorizedUser[]>('preview_users', () => [])
  const loading = useState<boolean>('preview_users_loading', () => false)

  const activeUser = computed(() => previewUser.value)
  const activeWorkspace = computed<PreviewWorkspace>(() => previewUser.value ? workspaceForUser(previewUser.value) : 'admin')

  const loadUsers = async () => {
    if (loading.value || users.value.length) return users.value
    loading.value = true
    try {
      const { userAuthorizationApi } = await import('~/api/user-authorization')
      users.value = await userAuthorizationApi.listUsers()
      return users.value
    } finally {
      loading.value = false
    }
  }

  const setPreviewUser = (user: AuthorizedUser | null) => { previewUser.value = user }
  const clearPreviewUser = () => { previewUser.value = null }

  return { users, loading, activeUser, activeWorkspace, loadUsers, setPreviewUser, clearPreviewUser }
}
