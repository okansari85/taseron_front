const normalizeRole = (role: string) => role.trim().toLocaleLowerCase('tr-TR').replace(/[_\s-]/g, '')

type Workspace = 'admin' | 'contractor' | 'security'

const workspaceForRoles = (roles: string[]): Workspace => {
  if (roles.some(role => normalizeRole(role).includes('guvenlik') || normalizeRole(role).includes('security'))) {
    return 'security'
  }

  if (roles.some(role => normalizeRole(role).includes('taseron') || normalizeRole(role).includes('contractor'))) {
    return 'contractor'
  }

  return 'admin'
}

const workspaceHome = (workspace: Workspace) => {
  if (workspace === 'security') return '/security'
  if (workspace === 'contractor') return '/contractor-portal/dashboard'
  return '/tenants'
}

const isPublicRoute = (path: string) => path === '/login' || path === '/contractor-portal/login'

export default defineNuxtPlugin(() => {
  const auth = useAuth()
  const route = useRoute()

  watch(
    () => auth.user.value?.roles,
    async roles => {
      if (!auth.isAuthenticated.value || !roles?.length || isPublicRoute(route.path)) return

      const workspace = workspaceForRoles(roles)
      const isContractorRoute = route.path === '/contractor-portal' || route.path.startsWith('/contractor-portal/')
      const isSecurityRoute = route.path === '/security' || route.path.startsWith('/security/')

      if (
        (workspace === 'contractor' && !isContractorRoute) ||
        (workspace === 'security' && !isSecurityRoute) ||
        (workspace === 'admin' && (isContractorRoute || isSecurityRoute))
      ) {
        await navigateTo(workspaceHome(workspace))
      }
    },
    { immediate: true },
  )
})
