// isgDesktopContext store (Lokasyon/Şube seçimi) sadece bellekte tutuluyordu
// — sayfa yenilenince (F5) Pinia state'i sıfırlanıp kullanıcı her seferinde
// "Lokasyon Seç" ekranına düşüyordu. Bu middleware auth.global.ts'nin hemen
// ardından (alfabetik sırada "auth" < "isg-desktop-context") çalışır: state
// zaten hazırsa (normal uygulama içi gezinme) hiçbir şey yapmaz; değilse
// store'un localStorage'daki son seçimi backend'den doğrulayarak geri
// yüklemesini (bkz. isgDesktopContext.ts::restore) BEKLER, hâlâ hazır
// değilse (hiç seçim yoksa veya artık geçersizse) Lokasyon Seç ekranına
// yönlendirir — sayfaların kendi onMounted kontrolleri buna dokunulmadan,
// artık sadece bu middleware'in yakalayamadığı istisnai durumlar için
// yedek olarak kalır.
const isSelectionRoute = (path: string) =>
  path === '/isg-portal/desktop/select-location' || path === '/isg-portal/desktop/select-branch'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/isg-portal/desktop') || isSelectionRoute(to.path)) return

  const context = useIsgDesktopContextStore()
  if (context.ready) return

  const auth = useAuth()
  if (!auth.initialized.value) {
    await auth.initialize()
  }

  const tenantId = auth.user.value?.tenant_id
  if (tenantId) {
    await context.restore(tenantId)
  }

  if (!context.ready) {
    return navigateTo('/isg-portal/desktop/select-location')
  }
})
