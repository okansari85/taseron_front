export function useTailAdminSidebar() {
  const isExpanded = useState('tailadmin-sidebar-expanded', () => true)
  const isMobileOpen = useState('tailadmin-sidebar-mobile', () => false)

  const toggle = () => {
    isExpanded.value = !isExpanded.value
  }

  const toggleMobile = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const closeMobile = () => {
    isMobileOpen.value = false
  }

  return {
    isExpanded,
    isMobileOpen,
    toggle,
    toggleMobile,
    closeMobile,
  }
}
