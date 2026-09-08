const normalizeRole = (role: string) => role.trim().toLocaleLowerCase('tr-TR').replace(/[_\s-]/g, '')

type Workspace = 'admin' | 'contractor' | 'security' | 'isg' | 'operation'

const workspaceForRoles = (roles: string[]): Workspace => {
  if (roles.some(role => normalizeRole(role).includes('guvenlik') || normalizeRole(role).includes('security'))) {
    return 'security'
  }

  if (roles.some(role => normalizeRole(role).includes('taseron') || normalizeRole(role).includes('contractor'))) {
    return 'contractor'
  }

  if (roles.some(role => normalizeRole(role) === 'isg')) {
    return 'isg'
  }

  if (roles.some(role => normalizeRole(role) === 'operation')) {
    return 'operation'
  }

  return 'admin'
}

const workspaceHome = (workspace: Workspace) => {
  if (workspace === 'security') return '/security'
  if (workspace === 'contractor') return '/contractor-portal/dashboard'
  if (workspace === 'isg') return '/isg-portal/documents'
  if (workspace === 'operation') return '/operation-portal/work-requests'
  return '/tenants'
}

const isPublicRoute = (path: string) => {
  return path === '/login' || path === '/contractor-portal/login' || path === '/isg-portal/login' || path === '/operation-portal/login'
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
  const isIsgRoute = to.path === '/isg-portal' || to.path.startsWith('/isg-portal/')
  const isOperationRoute = to.path === '/operation-portal' || to.path.startsWith('/operation-portal/')
  const isAdminRoute = !isContractorRoute && !isSecurityRoute && !isIsgRoute && !isOperationRoute

  if (workspace === 'contractor' && !isContractorRoute) {
    return navigateTo(workspaceHome(workspace))
  }

  if (workspace === 'security' && !isSecurityRoute) {
    return navigateTo(workspaceHome(workspace))
  }

  if (workspace === 'isg' && !isIsgRoute) {
    return navigateTo(workspaceHome(workspace))
  }

  if (workspace === 'operation' && !isOperationRoute) {
    return navigateTo(workspaceHome(workspace))
  }

  if (workspace === 'admin' && !isAdminRoute) {
    return navigateTo(workspaceHome(workspace))
  }
})
