const normalizeRole = (role: string) => role.trim().toLocaleLowerCase('tr-TR').replace(/[_\s-]/g, '')

/**
 * Süper admin bir tenant'ın içine girip yönetirken mevcut (super-admin)
 * layout'unu kullanmaya devam eder. Gerçek "tenant" rolündeki kullanıcı
 * (tenant yöneticisi / grup yöneticisi) aynı /tenants/[tenantId]/... sayfalarını
 * görür ama kendi ayrı layout'u (sidebar/header) içinde. Sayfa route'ları
 * ortak kalır, sadece görsel kabuk role göre değişir.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (!to.params.tenantId) return

  const auth = useAuth()
  const roles = auth.user.value?.roles ?? []

  const isSuperAdmin = roles.some(role => normalizeRole(role).includes('superadmin'))
  if (isSuperAdmin) return

  const isTenantRole = roles.some(role => normalizeRole(role) === 'tenant')
  if (isTenantRole) {
    setPageLayout('tenant')
  }
})
