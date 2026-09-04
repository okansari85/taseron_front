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

const isPublicRoute = (path: string) => {
  return path === '/login' || path === '/contractor-portal/login'
}

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  if (!auth.initialized.value) {
    await auth.initialize()
  }

  if (!auth.isAuthenticated.value) {
    if (isPublicRoute(to.path)) return
    return navigateTo('/login')
  }

  if (isPublicRoute(to.path)) {
    return navigateTo(workspaceHome(workspaceForRoles(auth.user.value?.roles ?? [])))
  }

  const workspace = workspaceForRoles(auth.user.value?.roles ?? [])
  const isContractorRoute = to.path === '/contractor-portal' || to.path.startsWith('/contractor-portal/')
  const isSecurityRoute = to.path === '/security' || to.path.startsWith('/security/')
  const isAdminRoute = !isContractorRoute && !isSecurityRoute

  if (workspace === 'contractor' && !isContractorRoute) {
    return navigateTo(workspaceHome(workspace))
  }

  if (workspace === 'security' && !isSecurityRoute) {
    return navigateTo(workspaceHome(workspace))
  }

  if (workspace === 'admin' && !isAdminRoute) {
    return navigateTo(workspaceHome(workspace))
  }
})
