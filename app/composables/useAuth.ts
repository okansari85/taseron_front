export type AuthUser = {
  id: number
  name: string
  email: string
  roles: string[]
}

type LoginResponse = {
  message: string
  token: string
  user: AuthUser
}

export const useAuth = () => {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    sameSite: 'lax',
    secure: !import.meta.dev,
    watch: true,
  })

  const user = useState<AuthUser | null>('auth_user', () => null)
  const initialized = useState<boolean>('auth_initialized', () => false)
  const loading = useState<boolean>('auth_loading', () => false)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  const initialize = async () => {
    if (initialized.value) return

    if (!token.value) {
      initialized.value = true
      return
    }

    try {
      const response = await apiClient<AuthUser>('/api/user')
      user.value = response
    } catch {
      token.value = null
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true

    try {
      const response = await apiClient<LoginResponse>('/api/login', {
        method: 'POST',
        body: { email, password },
      })

      token.value = response.token
      user.value = response.user
      initialized.value = true

      return response
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await apiClient('/api/logout', { method: 'POST' })
      }
    } finally {
      token.value = null
      user.value = null
      initialized.value = true
    }
  }

  return {
    token,
    user,
    initialized,
    loading,
    isAuthenticated,
    initialize,
    login,
    logout,
  }
}
