// Portal-specific login sayfaları (contractor-portal, isg-portal) kendi
// oturum akislarini kullanir ve auth.global.ts tarafindan admin /login'e
// yonlendirilmemelidir - o yonlendirme workspace.global.ts'de zaten dogru
// sekilde ele aliniyor (bkz. isPublicRoute).
const isPublicRoute = (path: string) =>
  path === '/login' || path === '/contractor-portal/login' || path === '/isg-portal/login' || path === '/operation-portal/login'

export default defineNuxtRouteMiddleware(async (to) => {
  const tenantContext = useTenantRequestContext()

  // tenantId route param'i olan admin sayfalarinda oldugu gibi otomatik
  // set edilir. contractor-portal / isg-portal gibi route param'i olmayan
  // portallarda ise tenantId giristen sonra elle set edilir (bkz. login
  // sayfalari) - burada temizlenmemeli, yoksa her navigasyonda X-Tenant-ID
  // kaybolur.
  if (to.params.tenantId) {
    tenantContext.setTenantId(to.params.tenantId)
  } else if (!to.path.startsWith('/contractor-portal') && !to.path.startsWith('/isg-portal') && !to.path.startsWith('/operation-portal')) {
    tenantContext.clearTenantId()
  }

  const auth = useAuth()

  await auth.initialize()

  if (isPublicRoute(to.path)) {
    if (auth.isAuthenticated.value) {
      return navigateTo('/')
    }

    return
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo('/login')
  }
})
