export const useIsgSidebar = () => {
  const isExpanded = useState('isg_sidebar_expanded', () => true)
  const isMobileOpen = useState('isg_sidebar_mobile_open', () => false)

  const restoreState = () => {
    if (!import.meta.client) return
    const saved = window.localStorage.getItem('isg_sidebar_expanded')
    if (saved !== null) isExpanded.value = saved !== 'false'
  }

  const toggle = () => {
    isExpanded.value = !isExpanded.value
    if (import.meta.client) window.localStorage.setItem('isg_sidebar_expanded', String(isExpanded.value))
  }

  const toggleMobile = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const closeMobile = () => {
    isMobileOpen.value = false
  }

  // ÖNEMLİ: restoreState() setup() sırasında SENKRON çağrılırsa (mount'tan
  // ÖNCE), sunucunun her zaman "açık" (isExpanded=true) varsayımıyla
  // ürettiği HTML ile client'ın localStorage'dan okuduğu (örn. "kapalı")
  // değer arasında hydration ANINDA bir uyumsuzluk oluşur — Vue bu durumda
  // sidebar genişliği / içerik margin'i class'larını güvenilir şekilde
  // senkronize edemeyebilir, sonuç sayfa yenilendiğinde sağda/solda kalıcı
  // boşluklar (bkz. kullanıcı raporu: "header sayfayı yenileyince genişlik
  // full olmuyor"). onMounted() hydration TAMAMLANDIKTAN SONRA çalıştığı
  // için ilk boyama her zaman sunucuyla tutarlı olur; localStorage'daki
  // farklı tercih varsa mevcut transition-[margin]/transition-all ile
  // kısa, düzgün bir animasyonla düzelir.
  onMounted(restoreState)

  return {
    isExpanded,
    isMobileOpen,
    toggle,
    toggleMobile,
    closeMobile,
  }
}
